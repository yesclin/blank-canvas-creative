
-- 1) Drop old constraints and add expanded ones
ALTER TABLE public.documentos_clinicos DROP CONSTRAINT documentos_clinicos_tipo_check;
ALTER TABLE public.documentos_clinicos ADD CONSTRAINT documentos_clinicos_tipo_check 
  CHECK (tipo::text = ANY (ARRAY['receituario','atestado','declaracao','relatorio']::text[]));

ALTER TABLE public.documentos_clinicos DROP CONSTRAINT documentos_clinicos_status_check;
ALTER TABLE public.documentos_clinicos ADD CONSTRAINT documentos_clinicos_status_check 
  CHECK (status::text = ANY (ARRAY['rascunho','emitido','cancelado']::text[]));

-- 2) Expand modelos_documento tipo constraint
ALTER TABLE public.modelos_documento DROP CONSTRAINT modelos_documento_tipo_check;
ALTER TABLE public.modelos_documento ADD CONSTRAINT modelos_documento_tipo_check 
  CHECK (tipo::text = ANY (ARRAY['receituario','atestado','declaracao','relatorio']::text[]));
