
-- Adicionar políticas RLS para template_fields
-- Esta tabela está com RLS ativo mas sem policies, bloqueando todas as operações

-- Policy para SELECT: usuários podem ver campos de templates da sua clínica
CREATE POLICY "Users can view template fields of their clinic"
ON public.template_fields
FOR SELECT
TO authenticated
USING (
  template_id IN (
    SELECT id FROM public.medical_record_templates 
    WHERE clinic_id = user_clinic_id(auth.uid())
  )
);

-- Policy para INSERT: usuários podem criar campos de templates da sua clínica
CREATE POLICY "Users can insert template fields in their clinic"
ON public.template_fields
FOR INSERT
TO authenticated
WITH CHECK (
  template_id IN (
    SELECT id FROM public.medical_record_templates 
    WHERE clinic_id = user_clinic_id(auth.uid())
  )
);

-- Policy para UPDATE: usuários podem atualizar campos de templates da sua clínica
CREATE POLICY "Users can update template fields in their clinic"
ON public.template_fields
FOR UPDATE
TO authenticated
USING (
  template_id IN (
    SELECT id FROM public.medical_record_templates 
    WHERE clinic_id = user_clinic_id(auth.uid())
  )
);

-- Policy para DELETE: usuários podem deletar campos de templates da sua clínica
CREATE POLICY "Users can delete template fields in their clinic"
ON public.template_fields
FOR DELETE
TO authenticated
USING (
  template_id IN (
    SELECT id FROM public.medical_record_templates 
    WHERE clinic_id = user_clinic_id(auth.uid())
  )
);
