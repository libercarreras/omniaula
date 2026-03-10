
CREATE TYPE public.estado_planificacion AS ENUM ('pendiente', 'completado', 'parcial', 'suspendido', 'reprogramado');

CREATE TABLE public.planificacion_clases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clase_id uuid NOT NULL REFERENCES public.clases(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  fecha date NOT NULL,
  unidad_index integer NOT NULL,
  tema_index integer NOT NULL,
  unidad_titulo text NOT NULL,
  tema_titulo text NOT NULL,
  estado estado_planificacion NOT NULL DEFAULT 'pendiente',
  diario_id uuid REFERENCES public.diario_clase(id) ON DELETE SET NULL,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(clase_id, fecha, tema_index, unidad_index)
);

ALTER TABLE public.planificacion_clases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "planificacion_select" ON public.planificacion_clases FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "planificacion_insert" ON public.planificacion_clases FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "planificacion_update" ON public.planificacion_clases FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "planificacion_delete" ON public.planificacion_clases FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_planificacion_clases_updated_at
  BEFORE UPDATE ON public.planificacion_clases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
