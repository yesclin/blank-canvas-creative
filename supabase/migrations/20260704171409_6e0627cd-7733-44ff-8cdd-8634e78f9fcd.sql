
-- Fix: recursos da clínica NÃO devem iniciar ativos automaticamente.
-- 1) Remover trigger e seed que ativavam tudo por padrão.
DROP TRIGGER IF EXISTS trg_seed_clinic_resources ON public.clinics;
DROP FUNCTION IF EXISTS public.tg_seed_clinic_resources() CASCADE;

-- 2) Neutralizar a função de seed (mantém a assinatura para não quebrar chamadas antigas,
--    mas passa a ser no-op — nada é ativado automaticamente).
CREATE OR REPLACE FUNCTION public.seed_clinic_resources(_clinic_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT 1 WHERE false;
$$;

-- 3) Limpar as ativações automáticas já criadas pelo seed anterior.
--    Critério: linhas com enabled=true e reason IS NULL representam o seed
--    automático (ativações manuais do Superadmin sempre gravam reason ou
--    são feitas via UI que registra logPlatformAction — as que ficarem
--    sem reason são o auto-seed a ser removido).
DELETE FROM public.clinic_resources
WHERE enabled = true AND reason IS NULL;
