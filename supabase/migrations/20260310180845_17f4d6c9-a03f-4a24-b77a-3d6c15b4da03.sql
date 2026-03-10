
CREATE TABLE public.evaluacion_contenido (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluacion_id uuid NOT NULL REFERENCES public.evaluaciones(id) ON DELETE CASCADE,
  orden integer NOT NULL DEFAULT 0,
  tipo_pregunta text NOT NULL DEFAULT 'abierta',
  enunciado text NOT NULL,
  opciones jsonb,
  puntos numeric DEFAULT 1,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.evaluacion_contenido ENABLE ROW LEVEL SECURITY;

CREATE POLICY "eval_contenido_select" ON public.evaluacion_contenido FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "eval_contenido_insert" ON public.evaluacion_contenido FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "eval_contenido_update" ON public.evaluacion_contenido FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "eval_contenido_delete" ON public.evaluacion_contenido FOR DELETE TO authenticated USING (auth.uid() = user_id);
