
-- Create programas_anuales table
CREATE TABLE public.programas_anuales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clase_id uuid NOT NULL REFERENCES public.clases(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  contenido text,
  archivo_url text,
  archivo_nombre text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.programas_anuales ENABLE ROW LEVEL SECURITY;

-- PERMISSIVE RLS policies
CREATE POLICY "programas_select" ON public.programas_anuales FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "programas_insert" ON public.programas_anuales FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "programas_update" ON public.programas_anuales FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "programas_delete" ON public.programas_anuales FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_programas_anuales_updated_at
  BEFORE UPDATE ON public.programas_anuales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket for program files
INSERT INTO storage.buckets (id, name, public) VALUES ('programas', 'programas', false);

-- Storage RLS policies
CREATE POLICY "Users can upload program files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'programas' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own program files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'programas' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own program files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'programas' AND (storage.foldername(name))[1] = auth.uid()::text);
