
-- Fix RESTRICTIVE policies on grupos table
DROP POLICY IF EXISTS "Institution members can view grupos" ON public.grupos;
DROP POLICY IF EXISTS "Users can delete own grupos" ON public.grupos;
DROP POLICY IF EXISTS "Users can insert own grupos" ON public.grupos;
DROP POLICY IF EXISTS "Users can update own grupos" ON public.grupos;
DROP POLICY IF EXISTS "Users can view own grupos" ON public.grupos;

CREATE POLICY "Users can view own grupos" ON public.grupos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Institution members can view grupos" ON public.grupos FOR SELECT TO authenticated USING (is_institucion_member(auth.uid(), institucion_id));
CREATE POLICY "Users can insert own grupos" ON public.grupos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own grupos" ON public.grupos FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own grupos" ON public.grupos FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Fix RESTRICTIVE policies on estudiantes table
DROP POLICY IF EXISTS "Collaborators can view shared students" ON public.estudiantes;
DROP POLICY IF EXISTS "Users can delete own estudiantes" ON public.estudiantes;
DROP POLICY IF EXISTS "Users can insert own estudiantes" ON public.estudiantes;
DROP POLICY IF EXISTS "Users can update own estudiantes" ON public.estudiantes;
DROP POLICY IF EXISTS "Users can view own estudiantes" ON public.estudiantes;

CREATE POLICY "Users can view own estudiantes" ON public.estudiantes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Collaborators can view shared students" ON public.estudiantes FOR SELECT TO authenticated USING (is_grupo_colaborador(auth.uid(), grupo_id));
CREATE POLICY "Users can insert own estudiantes" ON public.estudiantes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own estudiantes" ON public.estudiantes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own estudiantes" ON public.estudiantes FOR DELETE TO authenticated USING (auth.uid() = user_id);
