
CREATE TABLE public.medication_api_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  query_normalizada TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'internal',
  response_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_medication_cache_query ON public.medication_api_cache (query_normalizada, provider);
CREATE INDEX idx_medication_cache_expires ON public.medication_api_cache (expires_at);

ALTER TABLE public.medication_api_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read cache"
  ON public.medication_api_cache FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert cache"
  ON public.medication_api_cache FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
