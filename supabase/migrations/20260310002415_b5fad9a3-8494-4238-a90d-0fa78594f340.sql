
-- Fix ALL RESTRICTIVE RLS policies to PERMISSIVE for operational tables

-- ===== clases =====
DROP POLICY IF EXISTS "Users can delete own clases" ON public.clases;
DROP POLICY IF EXISTS "Users can insert own clases" ON public.clases;
DROP POLICY IF EXISTS "Users can update own clases" ON public.clases;
DROP POLICY IF EXISTS "Users can view own clases" ON public.clases;

CREATE POLICY "Users can select own clases" ON public.clases FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clases" ON public.clases FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clases" ON public.clases FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own clases" ON public.clases FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ===== asistencia =====
DROP POLICY IF EXISTS "Users can delete own asistencia" ON public.asistencia;
DROP POLICY IF EXISTS "Users can insert own asistencia" ON public.asistencia;
DROP POLICY IF EXISTS "Users can update own asistencia" ON public.asistencia;
DROP POLICY IF EXISTS "Users can view own asistencia" ON public.asistencia;

CREATE POLICY "Users can select own asistencia" ON public.asistencia FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own asistencia" ON public.asistencia FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own asistencia" ON public.asistencia FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own asistencia" ON public.asistencia FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ===== diario_clase =====
DROP POLICY IF EXISTS "Users can delete own diario" ON public.diario_clase;
DROP POLICY IF EXISTS "Users can insert own diario" ON public.diario_clase;
DROP POLICY IF EXISTS "Users can update own diario" ON public.diario_clase;
DROP POLICY IF EXISTS "Users can view own diario" ON public.diario_clase;

CREATE POLICY "Users can select own diario" ON public.diario_clase FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own diario" ON public.diario_clase FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own diario" ON public.diario_clase FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own diario" ON public.diario_clase FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ===== evaluaciones =====
DROP POLICY IF EXISTS "Users can delete own evaluaciones" ON public.evaluaciones;
DROP POLICY IF EXISTS "Users can insert own evaluaciones" ON public.evaluaciones;
DROP POLICY IF EXISTS "Users can update own evaluaciones" ON public.evaluaciones;
DROP POLICY IF EXISTS "Users can view own evaluaciones" ON public.evaluaciones;

CREATE POLICY "Users can select own evaluaciones" ON public.evaluaciones FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own evaluaciones" ON public.evaluaciones FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own evaluaciones" ON public.evaluaciones FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own evaluaciones" ON public.evaluaciones FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ===== notas =====
DROP POLICY IF EXISTS "Users can delete own notas" ON public.notas;
DROP POLICY IF EXISTS "Users can insert own notas" ON public.notas;
DROP POLICY IF EXISTS "Users can update own notas" ON public.notas;
DROP POLICY IF EXISTS "Users can view own notas" ON public.notas;

CREATE POLICY "Users can select own notas" ON public.notas FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notas" ON public.notas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notas" ON public.notas FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notas" ON public.notas FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ===== observaciones =====
DROP POLICY IF EXISTS "Users can delete own observaciones" ON public.observaciones;
DROP POLICY IF EXISTS "Users can insert own observaciones" ON public.observaciones;
DROP POLICY IF EXISTS "Users can update own observaciones" ON public.observaciones;
DROP POLICY IF EXISTS "Users can view own observaciones" ON public.observaciones;

CREATE POLICY "Users can select own observaciones" ON public.observaciones FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own observaciones" ON public.observaciones FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own observaciones" ON public.observaciones FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own observaciones" ON public.observaciones FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ===== tareas =====
DROP POLICY IF EXISTS "Users can delete own tareas" ON public.tareas;
DROP POLICY IF EXISTS "Users can insert own tareas" ON public.tareas;
DROP POLICY IF EXISTS "Users can update own tareas" ON public.tareas;
DROP POLICY IF EXISTS "Users can view own tareas" ON public.tareas;

CREATE POLICY "Users can select own tareas" ON public.tareas FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tareas" ON public.tareas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tareas" ON public.tareas FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tareas" ON public.tareas FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ===== entregas =====
DROP POLICY IF EXISTS "Users can delete own entregas" ON public.entregas;
DROP POLICY IF EXISTS "Users can insert own entregas" ON public.entregas;
DROP POLICY IF EXISTS "Users can update own entregas" ON public.entregas;
DROP POLICY IF EXISTS "Users can view own entregas" ON public.entregas;

CREATE POLICY "Users can select own entregas" ON public.entregas FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own entregas" ON public.entregas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own entregas" ON public.entregas FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own entregas" ON public.entregas FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ===== materias (already authenticated role but RESTRICTIVE) =====
DROP POLICY IF EXISTS "Users can delete own materias" ON public.materias;
DROP POLICY IF EXISTS "Users can insert own materias" ON public.materias;
DROP POLICY IF EXISTS "Users can update own materias" ON public.materias;
DROP POLICY IF EXISTS "Users can view own materias" ON public.materias;

CREATE POLICY "Users can select own materias" ON public.materias FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own materias" ON public.materias FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own materias" ON public.materias FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own materias" ON public.materias FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ===== estudiantes =====
DROP POLICY IF EXISTS "Users can delete own estudiantes" ON public.estudiantes;
DROP POLICY IF EXISTS "Users can insert own estudiantes" ON public.estudiantes;
DROP POLICY IF EXISTS "Users can update own estudiantes" ON public.estudiantes;
DROP POLICY IF EXISTS "Users can view own estudiantes" ON public.estudiantes;
DROP POLICY IF EXISTS "Collaborators can view shared students" ON public.estudiantes;

CREATE POLICY "Users can select own estudiantes" ON public.estudiantes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Collaborators can view shared students" ON public.estudiantes FOR SELECT TO authenticated USING (is_grupo_colaborador(auth.uid(), grupo_id));
CREATE POLICY "Users can insert own estudiantes" ON public.estudiantes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own estudiantes" ON public.estudiantes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own estudiantes" ON public.estudiantes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ===== grupos (keep institution member + owner SELECT, fix others) =====
DROP POLICY IF EXISTS "Users can delete own grupos" ON public.grupos;
DROP POLICY IF EXISTS "Users can insert own grupos" ON public.grupos;
DROP POLICY IF EXISTS "Users can update own grupos" ON public.grupos;
DROP POLICY IF EXISTS "Users can view own grupos" ON public.grupos;
DROP POLICY IF EXISTS "Institution members can view grupos" ON public.grupos;

CREATE POLICY "Users can select own grupos" ON public.grupos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Institution members can view grupos" ON public.grupos FOR SELECT TO authenticated USING (is_institucion_member(auth.uid(), institucion_id));
CREATE POLICY "Users can insert own grupos" ON public.grupos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own grupos" ON public.grupos FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own grupos" ON public.grupos FOR DELETE TO authenticated USING (auth.uid() = user_id);
