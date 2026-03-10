
-- Fix RLS: Drop all RESTRICTIVE policies and recreate as PERMISSIVE
-- Table: asistencia
DROP POLICY IF EXISTS "asistencia_select" ON public.asistencia;
DROP POLICY IF EXISTS "asistencia_insert" ON public.asistencia;
DROP POLICY IF EXISTS "asistencia_update" ON public.asistencia;
DROP POLICY IF EXISTS "asistencia_delete" ON public.asistencia;

CREATE POLICY "asistencia_select" ON public.asistencia FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "asistencia_insert" ON public.asistencia FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "asistencia_update" ON public.asistencia FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "asistencia_delete" ON public.asistencia FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Table: clases
DROP POLICY IF EXISTS "clases_select" ON public.clases;
DROP POLICY IF EXISTS "clases_insert" ON public.clases;
DROP POLICY IF EXISTS "clases_update" ON public.clases;
DROP POLICY IF EXISTS "clases_delete" ON public.clases;

CREATE POLICY "clases_select" ON public.clases FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "clases_insert" ON public.clases FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "clases_update" ON public.clases FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "clases_delete" ON public.clases FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Table: diario_clase
DROP POLICY IF EXISTS "diario_select" ON public.diario_clase;
DROP POLICY IF EXISTS "diario_insert" ON public.diario_clase;
DROP POLICY IF EXISTS "diario_update" ON public.diario_clase;
DROP POLICY IF EXISTS "diario_delete" ON public.diario_clase;

CREATE POLICY "diario_select" ON public.diario_clase FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "diario_insert" ON public.diario_clase FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "diario_update" ON public.diario_clase FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "diario_delete" ON public.diario_clase FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Table: evaluaciones
DROP POLICY IF EXISTS "evaluaciones_select" ON public.evaluaciones;
DROP POLICY IF EXISTS "evaluaciones_insert" ON public.evaluaciones;
DROP POLICY IF EXISTS "evaluaciones_update" ON public.evaluaciones;
DROP POLICY IF EXISTS "evaluaciones_delete" ON public.evaluaciones;

CREATE POLICY "evaluaciones_select" ON public.evaluaciones FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "evaluaciones_insert" ON public.evaluaciones FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "evaluaciones_update" ON public.evaluaciones FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "evaluaciones_delete" ON public.evaluaciones FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Table: notas
DROP POLICY IF EXISTS "notas_select" ON public.notas;
DROP POLICY IF EXISTS "notas_insert" ON public.notas;
DROP POLICY IF EXISTS "notas_update" ON public.notas;
DROP POLICY IF EXISTS "notas_delete" ON public.notas;

CREATE POLICY "notas_select" ON public.notas FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notas_insert" ON public.notas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notas_update" ON public.notas FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notas_delete" ON public.notas FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Table: observaciones
DROP POLICY IF EXISTS "observaciones_select" ON public.observaciones;
DROP POLICY IF EXISTS "observaciones_insert" ON public.observaciones;
DROP POLICY IF EXISTS "observaciones_update" ON public.observaciones;
DROP POLICY IF EXISTS "observaciones_delete" ON public.observaciones;

CREATE POLICY "observaciones_select" ON public.observaciones FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "observaciones_insert" ON public.observaciones FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "observaciones_update" ON public.observaciones FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "observaciones_delete" ON public.observaciones FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Table: tareas
DROP POLICY IF EXISTS "tareas_select" ON public.tareas;
DROP POLICY IF EXISTS "tareas_insert" ON public.tareas;
DROP POLICY IF EXISTS "tareas_update" ON public.tareas;
DROP POLICY IF EXISTS "tareas_delete" ON public.tareas;

CREATE POLICY "tareas_select" ON public.tareas FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "tareas_insert" ON public.tareas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tareas_update" ON public.tareas FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "tareas_delete" ON public.tareas FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Table: entregas
DROP POLICY IF EXISTS "entregas_select" ON public.entregas;
DROP POLICY IF EXISTS "entregas_insert" ON public.entregas;
DROP POLICY IF EXISTS "entregas_update" ON public.entregas;
DROP POLICY IF EXISTS "entregas_delete" ON public.entregas;

CREATE POLICY "entregas_select" ON public.entregas FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "entregas_insert" ON public.entregas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "entregas_update" ON public.entregas FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "entregas_delete" ON public.entregas FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Table: materias
DROP POLICY IF EXISTS "materias_select" ON public.materias;
DROP POLICY IF EXISTS "materias_insert" ON public.materias;
DROP POLICY IF EXISTS "materias_update" ON public.materias;
DROP POLICY IF EXISTS "materias_delete" ON public.materias;

CREATE POLICY "materias_select" ON public.materias FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "materias_insert" ON public.materias FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "materias_update" ON public.materias FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "materias_delete" ON public.materias FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Table: estudiantes (keep estudiantes_select_colab intact)
DROP POLICY IF EXISTS "estudiantes_select" ON public.estudiantes;
DROP POLICY IF EXISTS "estudiantes_insert" ON public.estudiantes;
DROP POLICY IF EXISTS "estudiantes_update" ON public.estudiantes;
DROP POLICY IF EXISTS "estudiantes_delete" ON public.estudiantes;
DROP POLICY IF EXISTS "estudiantes_select_colab" ON public.estudiantes;

CREATE POLICY "estudiantes_select" ON public.estudiantes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "estudiantes_select_colab" ON public.estudiantes FOR SELECT TO authenticated USING (is_grupo_colaborador(auth.uid(), grupo_id));
CREATE POLICY "estudiantes_insert" ON public.estudiantes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "estudiantes_update" ON public.estudiantes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "estudiantes_delete" ON public.estudiantes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Table: grupos (keep grupos_select_inst intact)
DROP POLICY IF EXISTS "grupos_select" ON public.grupos;
DROP POLICY IF EXISTS "grupos_insert" ON public.grupos;
DROP POLICY IF EXISTS "grupos_update" ON public.grupos;
DROP POLICY IF EXISTS "grupos_delete" ON public.grupos;
DROP POLICY IF EXISTS "grupos_select_inst" ON public.grupos;

CREATE POLICY "grupos_select" ON public.grupos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "grupos_select_inst" ON public.grupos FOR SELECT TO authenticated USING (is_institucion_member(auth.uid(), institucion_id));
CREATE POLICY "grupos_insert" ON public.grupos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "grupos_update" ON public.grupos FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "grupos_delete" ON public.grupos FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Also fix grupo_colaboradores
DROP POLICY IF EXISTS "gc_owner_all" ON public.grupo_colaboradores;
DROP POLICY IF EXISTS "gc_select_colab" ON public.grupo_colaboradores;
DROP POLICY IF EXISTS "gc_update_colab" ON public.grupo_colaboradores;

CREATE POLICY "gc_owner_all" ON public.grupo_colaboradores FOR ALL TO authenticated USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "gc_select_colab" ON public.grupo_colaboradores FOR SELECT TO authenticated USING (auth.uid() = colaborador_user_id);
CREATE POLICY "gc_update_colab" ON public.grupo_colaboradores FOR UPDATE TO authenticated USING (auth.uid() = colaborador_user_id);

-- Fix profesor_institucion
DROP POLICY IF EXISTS "prof_inst_select" ON public.profesor_institucion;
DROP POLICY IF EXISTS "prof_inst_insert" ON public.profesor_institucion;
DROP POLICY IF EXISTS "prof_inst_update" ON public.profesor_institucion;
DROP POLICY IF EXISTS "prof_inst_delete" ON public.profesor_institucion;

CREATE POLICY "prof_inst_select" ON public.profesor_institucion FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "prof_inst_insert" ON public.profesor_institucion FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "prof_inst_update" ON public.profesor_institucion FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "prof_inst_delete" ON public.profesor_institucion FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Fix instituciones
DROP POLICY IF EXISTS "inst_select" ON public.instituciones;
DROP POLICY IF EXISTS "inst_insert" ON public.instituciones;
DROP POLICY IF EXISTS "inst_update" ON public.instituciones;
DROP POLICY IF EXISTS "inst_delete" ON public.instituciones;

CREATE POLICY "inst_select" ON public.instituciones FOR SELECT TO authenticated USING ((auth.uid() = user_id) OR is_institucion_member(auth.uid(), id));
CREATE POLICY "inst_insert" ON public.instituciones FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "inst_update" ON public.instituciones FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM profesor_institucion WHERE user_id = auth.uid() AND institucion_id = instituciones.id AND rol = 'administrador'));
CREATE POLICY "inst_delete" ON public.instituciones FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM profesor_institucion WHERE user_id = auth.uid() AND institucion_id = instituciones.id AND rol = 'administrador'));

-- Fix profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can search profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO public USING (auth.uid() = user_id);
CREATE POLICY "Users can search profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix plan_limits
DROP POLICY IF EXISTS "Anyone can read plan limits" ON public.plan_limits;
CREATE POLICY "Anyone can read plan limits" ON public.plan_limits FOR SELECT TO authenticated USING (true);
