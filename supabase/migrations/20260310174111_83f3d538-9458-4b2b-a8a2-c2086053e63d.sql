
-- Create nivel_participacion enum
CREATE TYPE public.nivel_participacion AS ENUM ('alta', 'media', 'baja');

-- Create participacion_clase table
CREATE TABLE public.participacion_clase (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clase_id uuid NOT NULL REFERENCES public.clases(id) ON DELETE CASCADE,
  estudiante_id uuid NOT NULL REFERENCES public.estudiantes(id) ON DELETE CASCADE,
  fecha date NOT NULL DEFAULT CURRENT_DATE,
  nivel nivel_participacion NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (clase_id, estudiante_id, fecha)
);

-- Enable RLS
ALTER TABLE public.participacion_clase ENABLE ROW LEVEL SECURITY;

-- Permissive RLS policies
CREATE POLICY "participacion_select" ON public.participacion_clase FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "participacion_insert" ON public.participacion_clase FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "participacion_update" ON public.participacion_clase FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "participacion_delete" ON public.participacion_clase FOR DELETE TO authenticated USING (auth.uid() = user_id);
