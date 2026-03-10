
-- Fix RLS: Drop all RESTRICTIVE policies and recreate as PERMISSIVE
-- Using exact policy names from current database state

-- ========== CLASES ==========
DROP POLICY IF EXISTS "Users can delete own clases" ON public.clases;
DROP POLICY IF EXISTS "Users can insert own clases" ON public.clases;
DROP POLICY IF EXISTS "Users can select own clases" ON public.clases;
DROP POLICY IF EXISTS "Users can update own clases" ON public.clases;

CREATE POLICY "clases_select" ON public.clases FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "clases_insert" ON public.clases FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "clases_update" ON public.clases FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "clases_delete" ON public.clases FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== ASISTENCIA ==========
DROP POLICY IF EXISTS "Users can delete own asistencia" ON public.asistencia;
DROP POLICY IF EXISTS "Users can insert own asistencia" ON public.asistencia;
DROP POLICY IF EXISTS "Users can select own asistencia" ON public.asistencia;
DROP POLICY IF EXISTS "Users can update own asistencia" ON public.asistencia;

CREATE POLICY "asistencia_select" ON public.asistencia FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "asistencia_insert" ON public.asistencia FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "asistencia_update" ON public.asistencia FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "asistencia_delete" ON public.asistencia FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== DIARIO_CLASE ==========
DROP POLICY IF EXISTS "Users can delete own diario" ON public.diario_clase;
DROP POLICY IF EXISTS "Users can insert own diario" ON public.diario_clase;
DROP POLICY IF EXISTS "Users can select own diario" ON public.diario_clase;
DROP POLICY IF EXISTS "Users can update own diario" ON public.diario_clase;

CREATE POLICY "diario_select" ON public.diario_clase FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "diario_insert" ON public.diario_clase FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "diario_update" ON public.diario_clase FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "diario_delete" ON public.diario_clase FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== EVALUACIONES ==========
DROP POLICY IF EXISTS "Users can delete own evaluaciones" ON public.evaluaciones;
DROP POLICY IF EXISTS "Users can insert own evaluaciones" ON public.evaluaciones;
DROP POLICY IF EXISTS "Users can select own evaluaciones" ON public.evaluaciones;
DROP POLICY IF EXISTS "Users can update own evaluaciones" ON public.evaluaciones;

CREATE POLICY "evaluaciones_select" ON public.evaluaciones FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "evaluaciones_insert" ON public.evaluaciones FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "evaluaciones_update" ON public.evaluaciones FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "evaluaciones_delete" ON public.evaluaciones FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== NOTAS ==========
DROP POLICY IF EXISTS "Users can delete own notas" ON public.notas;
DROP POLICY IF EXISTS "Users can insert own notas" ON public.notas;
DROP POLICY IF EXISTS "Users can select own notas" ON public.notas;
DROP POLICY IF EXISTS "Users can update own notas" ON public.notas;

CREATE POLICY "notas_select" ON public.notas FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notas_insert" ON public.notas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notas_update" ON public.notas FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notas_delete" ON public.notas FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== OBSERVACIONES ==========
DROP POLICY IF EXISTS "Users can delete own observaciones" ON public.observaciones;
DROP POLICY IF EXISTS "Users can insert own observaciones" ON public.observaciones;
DROP POLICY IF EXISTS "Users can select own observaciones" ON public.observaciones;
DROP POLICY IF EXISTS "Users can update own observaciones" ON public.observaciones;

CREATE POLICY "observaciones_select" ON public.observaciones FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "observaciones_insert" ON public.observaciones FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "observaciones_update" ON public.observaciones FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "observaciones_delete" ON public.observaciones FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== TAREAS ==========
DROP POLICY IF EXISTS "Users can delete own tareas" ON public.tareas;
DROP POLICY IF EXISTS "Users can insert own tareas" ON public.tareas;
DROP POLICY IF EXISTS "Users can select own tareas" ON public.tareas;
DROP POLICY IF EXISTS "Users can update own tareas" ON public.tareas;

CREATE POLICY "tareas_select" ON public.tareas FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "tareas_insert" ON public.tareas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tareas_update" ON public.tareas FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "tareas_delete" ON public.tareas FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== ENTREGAS ==========
DROP POLICY IF EXISTS "Users can delete own entregas" ON public.entregas;
DROP POLICY IF EXISTS "Users can insert own entregas" ON public.entregas;
DROP POLICY IF EXISTS "Users can select own entregas" ON public.entregas;
DROP POLICY IF EXISTS "Users can update own entregas" ON public.entregas;

CREATE POLICY "entregas_select" ON public.entregas FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "entregas_insert" ON public.entregas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "entregas_update" ON public.entregas FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "entregas_delete" ON public.entregas FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== MATERIAS ==========
DROP POLICY IF EXISTS "Users can delete own materias" ON public.materias;
DROP POLICY IF EXISTS "Users can insert own materias" ON public.materias;
DROP POLICY IF EXISTS "Users can select own materias" ON public.materias;
DROP POLICY IF EXISTS "Users can update own materias" ON public.materias;

CREATE POLICY "materias_select" ON public.materias FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "materias_insert" ON public.materias FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "materias_update" ON public.materias FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "materias_delete" ON public.materias FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== ESTUDIANTES ==========
DROP POLICY IF EXISTS "Users can delete own estudiantes" ON public.estudiantes;
DROP POLICY IF EXISTS "Users can insert own estudiantes" ON public.estudiantes;
DROP POLICY IF EXISTS "Users can select own estudiantes" ON public.estudiantes;
DROP POLICY IF EXISTS "Users can update own estudiantes" ON public.estudiantes;
DROP POLICY IF EXISTS "Collaborators can view shared students" ON public.estudiantes;

CREATE POLICY "estudiantes_select" ON public.estudiantes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "estudiantes_select_colab" ON public.estudiantes FOR SELECT TO authenticated USING (is_grupo_colaborador(auth.uid(), grupo_id));
CREATE POLICY "estudiantes_insert" ON public.estudiantes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "estudiantes_update" ON public.estudiantes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "estudiantes_delete" ON public.estudiantes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== GRUPOS ==========
DROP POLICY IF EXISTS "Users can delete own grupos" ON public.grupos;
DROP POLICY IF EXISTS "Users can insert own grupos" ON public.grupos;
DROP POLICY IF EXISTS "Users can select own grupos" ON public.grupos;
DROP POLICY IF EXISTS "Users can update own grupos" ON public.grupos;
DROP POLICY IF EXISTS "Institution members can view grupos" ON public.grupos;

CREATE POLICY "grupos_select" ON public.grupos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "grupos_select_inst" ON public.grupos FOR SELECT TO authenticated USING (is_institucion_member(auth.uid(), institucion_id));
CREATE POLICY "grupos_insert" ON public.grupos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "grupos_update" ON public.grupos FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "grupos_delete" ON public.grupos FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== PROFESOR_INSTITUCION ==========
DROP POLICY IF EXISTS "Users can delete own memberships" ON public.profesor_institucion;
DROP POLICY IF EXISTS "Users can insert own memberships" ON public.profesor_institucion;
DROP POLICY IF EXISTS "Users can view own memberships" ON public.profesor_institucion;
DROP POLICY IF EXISTS "Users can update own memberships" ON public.profesor_institucion;

CREATE POLICY "prof_inst_select" ON public.profesor_institucion FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "prof_inst_insert" ON public.profesor_institucion FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "prof_inst_update" ON public.profesor_institucion FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "prof_inst_delete" ON public.profesor_institucion FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== INSTITUCIONES ==========
DROP POLICY IF EXISTS "Admins can delete instituciones" ON public.instituciones;
DROP POLICY IF EXISTS "Admins can update instituciones" ON public.instituciones;
DROP POLICY IF EXISTS "Authenticated can create instituciones" ON public.instituciones;
DROP POLICY IF EXISTS "Members can view instituciones" ON public.instituciones;
DROP POLICY IF EXISTS "Owner can view own instituciones" ON public.instituciones;

CREATE POLICY "inst_select" ON public.instituciones FOR SELECT TO authenticated USING (auth.uid() = user_id OR is_institucion_member(auth.uid(), id));
CREATE POLICY "inst_insert" ON public.instituciones FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "inst_update" ON public.instituciones FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profesor_institucion WHERE user_id = auth.uid() AND institucion_id = instituciones.id AND rol = 'administrador'));
CREATE POLICY "inst_delete" ON public.instituciones FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profesor_institucion WHERE user_id = auth.uid() AND institucion_id = instituciones.id AND rol = 'administrador'));

-- ========== GRUPO_COLABORADORES ==========
DROP POLICY IF EXISTS "Colaborador can update own invitations" ON public.grupo_colaboradores;
DROP POLICY IF EXISTS "Colaborador can view own invitations" ON public.grupo_colaboradores;
DROP POLICY IF EXISTS "Owner can manage invitations" ON public.grupo_colaboradores;

CREATE POLICY "gc_select_colab" ON public.grupo_colaboradores FOR SELECT TO authenticated USING (auth.uid() = colaborador_user_id);
CREATE POLICY "gc_update_colab" ON public.grupo_colaboradores FOR UPDATE TO authenticated USING (auth.uid() = colaborador_user_id);
CREATE POLICY "gc_owner_all" ON public.grupo_colaboradores FOR ALL TO authenticated USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);
