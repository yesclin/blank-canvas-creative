-- Corrigir política permissiva de INSERT em clinics
-- Removendo a política antiga e criando uma mais restritiva
DROP POLICY IF EXISTS "Authenticated users can create clinic" ON public.clinics;

-- Apenas usuários autenticados que ainda não têm clínica podem criar uma
CREATE POLICY "Authenticated users can create first clinic"
ON public.clinics FOR INSERT
TO authenticated
WITH CHECK (
    NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid()
    )
);