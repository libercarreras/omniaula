
-- Create desempeno_diario table
CREATE TABLE public.desempeno_diario (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clase_id uuid NOT NULL REFERENCES public.clases(id) ON DELETE CASCADE,
  estudiante_id uuid NOT NULL REFERENCES public.estudiantes(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  user_id uuid NOT NULL,
  tarea text,
  participacion_oral text,
  rendimiento_aula text,
  conducta text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(clase_id, estudiante_id, fecha)
);

-- Enable RLS
ALTER TABLE public.desempeno_diario ENABLE ROW LEVEL SECURITY;

-- RLS policies (PERMISSIVE)
CREATE POLICY "desempeno_select" ON public.desempeno_diario FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "desempeno_insert" ON public.desempeno_diario FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "desempeno_update" ON public.desempeno_diario FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "desempeno_delete" ON public.desempeno_diario FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_desempeno_diario_updated_at
  BEFORE UPDATE ON public.desempeno_diario
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
