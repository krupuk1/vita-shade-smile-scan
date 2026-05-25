
CREATE TABLE IF NOT EXISTS public.ai_provider_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  provider text NOT NULL DEFAULT 'lovable',
  model text NOT NULL DEFAULT 'google/gemini-2.5-flash',
  api_key text,
  base_url text,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ai_provider_settings_provider_check CHECK (provider IN ('lovable','openai','gemini','openrouter','openai_compatible'))
);

ALTER TABLE public.ai_provider_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view ai settings" ON public.ai_provider_settings
  FOR SELECT TO authenticated
  USING (app_private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins insert ai settings" ON public.ai_provider_settings
  FOR INSERT TO authenticated
  WITH CHECK (app_private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update ai settings" ON public.ai_provider_settings
  FOR UPDATE TO authenticated
  USING (app_private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (app_private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER ai_provider_settings_set_updated_at
BEFORE UPDATE ON public.ai_provider_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.ai_provider_settings (singleton, provider, model)
VALUES (true, 'lovable', 'google/gemini-2.5-flash')
ON CONFLICT (singleton) DO NOTHING;
