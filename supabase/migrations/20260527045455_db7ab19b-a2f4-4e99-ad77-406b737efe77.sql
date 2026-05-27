
CREATE TABLE public.risk_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  analysis jsonb NOT NULL,
  overall_score numeric,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.risk_analyses TO authenticated;
GRANT ALL ON public.risk_analyses TO service_role;

ALTER TABLE public.risk_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Risk viewable by owner or admin" ON public.risk_analyses
  FOR SELECT USING (auth.uid() = user_id OR app_private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users insert own risk" ON public.risk_analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own risk" ON public.risk_analyses
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own risk" ON public.risk_analyses
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_risk_user_created ON public.risk_analyses(user_id, created_at DESC);

INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatars publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar" ON storage.objects
  FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own avatar" ON storage.objects
  FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
