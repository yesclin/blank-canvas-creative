
-- 1. Tabela platform_users
CREATE TABLE IF NOT EXISTS public.platform_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  email text NOT NULL,
  full_name text NULL,
  role text NOT NULL DEFAULT 'support',
  status text NOT NULL DEFAULT 'invited',
  notes text NULL,
  invited_by uuid NULL,
  invited_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz NULL,
  last_login_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT platform_users_role_chk CHECK (role IN ('super_admin','support','operations','saas_finance')),
  CONSTRAINT platform_users_status_chk CHECK (status IN ('active','inactive','invited'))
);

CREATE UNIQUE INDEX IF NOT EXISTS platform_users_email_uniq ON public.platform_users (lower(email));
CREATE INDEX IF NOT EXISTS platform_users_user_id_idx ON public.platform_users (user_id);
CREATE INDEX IF NOT EXISTS platform_users_role_idx ON public.platform_users (role);
CREATE INDEX IF NOT EXISTS platform_users_status_idx ON public.platform_users (status);

-- 2. Trigger updated_at
CREATE OR REPLACE FUNCTION public.platform_users_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_platform_users_updated_at ON public.platform_users;
CREATE TRIGGER trg_platform_users_updated_at
BEFORE UPDATE ON public.platform_users
FOR EACH ROW EXECUTE FUNCTION public.platform_users_set_updated_at();

-- 3. Seed: migrar platform_admins existentes
INSERT INTO public.platform_users (user_id, email, full_name, role, status, accepted_at, created_at)
SELECT pa.user_id,
       COALESCE(pa.email, (SELECT u.email FROM auth.users u WHERE u.id = pa.user_id)),
       pa.full_name,
       'super_admin',
       CASE WHEN pa.is_active THEN 'active' ELSE 'inactive' END,
       pa.created_at,
       pa.created_at
FROM public.platform_admins pa
WHERE pa.email IS NOT NULL OR pa.user_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 4. Atualizar is_platform_admin para usar ambas as tabelas
CREATE OR REPLACE FUNCTION public.is_platform_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins
    WHERE user_id = _user_id AND is_active = true
  ) OR EXISTS (
    SELECT 1 FROM public.platform_users
    WHERE user_id = _user_id AND role = 'super_admin' AND status = 'active'
  );
$$;

-- 5. Função específica super_admin (para gestão da própria platform_users)
CREATE OR REPLACE FUNCTION public.is_platform_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins
    WHERE user_id = _user_id AND is_active = true
  ) OR EXISTS (
    SELECT 1 FROM public.platform_users
    WHERE user_id = _user_id AND role = 'super_admin' AND status = 'active'
  );
$$;

-- 6. Função para contar super admins ativos (qualquer fonte)
CREATE OR REPLACE FUNCTION public.count_active_super_admins()
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT (
    (SELECT COUNT(*) FROM public.platform_admins WHERE is_active = true)
    +
    (SELECT COUNT(*) FROM public.platform_users
       WHERE role = 'super_admin' AND status = 'active'
       AND (user_id IS NULL OR user_id NOT IN (SELECT user_id FROM public.platform_admins WHERE is_active = true)))
  )::int;
$$;

-- 7. Trigger anti "remover último super admin"
CREATE OR REPLACE FUNCTION public.platform_users_protect_last_super_admin()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE
  v_was_active_super boolean := (OLD.role = 'super_admin' AND OLD.status = 'active');
  v_will_be_active_super boolean;
  v_remaining int;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_will_be_active_super := false;
  ELSE
    v_will_be_active_super := (NEW.role = 'super_admin' AND NEW.status = 'active');
  END IF;

  IF v_was_active_super AND NOT v_will_be_active_super THEN
    SELECT count_active_super_admins() INTO v_remaining;
    -- se este registro contava no total, subtrai 1 para checar o pós-mudança
    IF v_remaining <= 1 THEN
      RAISE EXCEPTION 'last_super_admin' USING HINT = 'Não é possível remover o único Super Admin ativo.';
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_platform_users_protect_last ON public.platform_users;
CREATE TRIGGER trg_platform_users_protect_last
BEFORE UPDATE OR DELETE ON public.platform_users
FOR EACH ROW EXECUTE FUNCTION public.platform_users_protect_last_super_admin();

-- 8. RLS
ALTER TABLE public.platform_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "platform_users_select_super_admin" ON public.platform_users;
CREATE POLICY "platform_users_select_super_admin"
ON public.platform_users FOR SELECT TO authenticated
USING (public.is_platform_super_admin(auth.uid()) OR user_id = auth.uid());

DROP POLICY IF EXISTS "platform_users_insert_super_admin" ON public.platform_users;
CREATE POLICY "platform_users_insert_super_admin"
ON public.platform_users FOR INSERT TO authenticated
WITH CHECK (public.is_platform_super_admin(auth.uid()));

DROP POLICY IF EXISTS "platform_users_update_super_admin" ON public.platform_users;
CREATE POLICY "platform_users_update_super_admin"
ON public.platform_users FOR UPDATE TO authenticated
USING (public.is_platform_super_admin(auth.uid()))
WITH CHECK (public.is_platform_super_admin(auth.uid()));

DROP POLICY IF EXISTS "platform_users_delete_super_admin" ON public.platform_users;
CREATE POLICY "platform_users_delete_super_admin"
ON public.platform_users FOR DELETE TO authenticated
USING (public.is_platform_super_admin(auth.uid()));
