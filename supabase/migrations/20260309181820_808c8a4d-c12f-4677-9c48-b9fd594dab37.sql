
-- Add plan and avatar to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'premium'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create plan limits config table (read-only reference)
CREATE TABLE public.plan_limits (
  plan TEXT PRIMARY KEY,
  max_grupos INT NOT NULL,
  max_estudiantes_por_grupo INT NOT NULL,
  informes_avanzados BOOLEAN NOT NULL DEFAULT false,
  analisis_completo BOOLEAN NOT NULL DEFAULT false,
  exportacion BOOLEAN NOT NULL DEFAULT false,
  comentarios_ia BOOLEAN NOT NULL DEFAULT false
);
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read plan limits" ON public.plan_limits FOR SELECT TO authenticated USING (true);

INSERT INTO public.plan_limits (plan, max_grupos, max_estudiantes_por_grupo, informes_avanzados, analisis_completo, exportacion, comentarios_ia)
VALUES
  ('free', 3, 40, false, false, false, false),
  ('premium', 999999, 999999, true, true, true, true);

-- Update handle_new_user to include plan
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nombre, email, plan)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nombre', ''), NEW.email, 'free');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
