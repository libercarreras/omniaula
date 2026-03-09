
-- Función reutilizable para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =====================
-- PROFILES (datos del docente)
-- =====================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL DEFAULT '',
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nombre, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nombre', ''), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================
-- MATERIAS
-- =====================
CREATE TABLE public.materias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  color TEXT DEFAULT 'bg-primary',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.materias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own materias" ON public.materias FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own materias" ON public.materias FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own materias" ON public.materias FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own materias" ON public.materias FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_materias_updated_at BEFORE UPDATE ON public.materias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- GRUPOS
-- =====================
CREATE TABLE public.grupos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  anio TEXT,
  turno TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.grupos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own grupos" ON public.grupos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own grupos" ON public.grupos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own grupos" ON public.grupos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own grupos" ON public.grupos FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_grupos_updated_at BEFORE UPDATE ON public.grupos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- ESTUDIANTES
-- =====================
CREATE TABLE public.estudiantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grupo_id UUID NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,
  nombre_completo TEXT NOT NULL,
  numero_lista INT,
  foto_url TEXT,
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.estudiantes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own estudiantes" ON public.estudiantes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own estudiantes" ON public.estudiantes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own estudiantes" ON public.estudiantes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own estudiantes" ON public.estudiantes FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_estudiantes_updated_at BEFORE UPDATE ON public.estudiantes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- CLASES (materia + grupo)
-- =====================
CREATE TABLE public.clases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  materia_id UUID NOT NULL REFERENCES public.materias(id) ON DELETE CASCADE,
  grupo_id UUID NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,
  horario TEXT,
  aula TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(materia_id, grupo_id)
);
ALTER TABLE public.clases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own clases" ON public.clases FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clases" ON public.clases FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clases" ON public.clases FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own clases" ON public.clases FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_clases_updated_at BEFORE UPDATE ON public.clases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- ASISTENCIA
-- =====================
CREATE TYPE public.estado_asistencia AS ENUM ('presente', 'falta', 'tarde', 'retiro');

CREATE TABLE public.asistencia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clase_id UUID NOT NULL REFERENCES public.clases(id) ON DELETE CASCADE,
  estudiante_id UUID NOT NULL REFERENCES public.estudiantes(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  estado public.estado_asistencia NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(clase_id, estudiante_id, fecha)
);
ALTER TABLE public.asistencia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own asistencia" ON public.asistencia FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own asistencia" ON public.asistencia FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own asistencia" ON public.asistencia FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own asistencia" ON public.asistencia FOR DELETE USING (auth.uid() = user_id);

-- =====================
-- EVALUACIONES
-- =====================
CREATE TYPE public.tipo_evaluacion AS ENUM ('prueba_escrita', 'oral', 'trabajo_practico', 'laboratorio', 'tarea', 'evaluacion_formativa');

CREATE TABLE public.evaluaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clase_id UUID NOT NULL REFERENCES public.clases(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tipo public.tipo_evaluacion NOT NULL,
  fecha DATE,
  peso NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.evaluaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own evaluaciones" ON public.evaluaciones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own evaluaciones" ON public.evaluaciones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own evaluaciones" ON public.evaluaciones FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own evaluaciones" ON public.evaluaciones FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_evaluaciones_updated_at BEFORE UPDATE ON public.evaluaciones FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- NOTAS (calificaciones)
-- =====================
CREATE TABLE public.notas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  evaluacion_id UUID NOT NULL REFERENCES public.evaluaciones(id) ON DELETE CASCADE,
  estudiante_id UUID NOT NULL REFERENCES public.estudiantes(id) ON DELETE CASCADE,
  nota NUMERIC,
  observacion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(evaluacion_id, estudiante_id)
);
ALTER TABLE public.notas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notas" ON public.notas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notas" ON public.notas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notas" ON public.notas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notas" ON public.notas FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_notas_updated_at BEFORE UPDATE ON public.notas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- OBSERVACIONES DEL ESTUDIANTE
-- =====================
CREATE TYPE public.tipo_observacion AS ENUM ('participacion', 'actitud', 'cumplimiento_tareas', 'dificultad_contenidos');

CREATE TABLE public.observaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clase_id UUID NOT NULL REFERENCES public.clases(id) ON DELETE CASCADE,
  estudiante_id UUID NOT NULL REFERENCES public.estudiantes(id) ON DELETE CASCADE,
  tipo public.tipo_observacion NOT NULL,
  descripcion TEXT NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.observaciones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own observaciones" ON public.observaciones FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own observaciones" ON public.observaciones FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own observaciones" ON public.observaciones FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own observaciones" ON public.observaciones FOR DELETE USING (auth.uid() = user_id);

-- =====================
-- DIARIO DE CLASE
-- =====================
CREATE TABLE public.diario_clase (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clase_id UUID NOT NULL REFERENCES public.clases(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  tema_trabajado TEXT,
  actividad_realizada TEXT,
  observaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.diario_clase ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own diario" ON public.diario_clase FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own diario" ON public.diario_clase FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own diario" ON public.diario_clase FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own diario" ON public.diario_clase FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_diario_updated_at BEFORE UPDATE ON public.diario_clase FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- TAREAS
-- =====================
CREATE TABLE public.tareas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  clase_id UUID NOT NULL REFERENCES public.clases(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha_entrega DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tareas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own tareas" ON public.tareas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tareas" ON public.tareas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tareas" ON public.tareas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tareas" ON public.tareas FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_tareas_updated_at BEFORE UPDATE ON public.tareas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- ENTREGAS DE TAREAS
-- =====================
CREATE TYPE public.estado_entrega AS ENUM ('entregado', 'no_entregado');

CREATE TABLE public.entregas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tarea_id UUID NOT NULL REFERENCES public.tareas(id) ON DELETE CASCADE,
  estudiante_id UUID NOT NULL REFERENCES public.estudiantes(id) ON DELETE CASCADE,
  estado public.estado_entrega NOT NULL DEFAULT 'no_entregado',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tarea_id, estudiante_id)
);
ALTER TABLE public.entregas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own entregas" ON public.entregas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own entregas" ON public.entregas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own entregas" ON public.entregas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own entregas" ON public.entregas FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER update_entregas_updated_at BEFORE UPDATE ON public.entregas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- INDEXES
-- =====================
CREATE INDEX idx_estudiantes_grupo ON public.estudiantes(grupo_id);
CREATE INDEX idx_clases_materia ON public.clases(materia_id);
CREATE INDEX idx_clases_grupo ON public.clases(grupo_id);
CREATE INDEX idx_asistencia_clase_fecha ON public.asistencia(clase_id, fecha);
CREATE INDEX idx_evaluaciones_clase ON public.evaluaciones(clase_id);
CREATE INDEX idx_observaciones_estudiante ON public.observaciones(estudiante_id);
CREATE INDEX idx_diario_clase_fecha ON public.diario_clase(clase_id, fecha);
CREATE INDEX idx_notas_evaluacion ON public.notas(evaluacion_id);
CREATE INDEX idx_tareas_clase ON public.tareas(clase_id);
CREATE INDEX idx_entregas_tarea ON public.entregas(tarea_id);
