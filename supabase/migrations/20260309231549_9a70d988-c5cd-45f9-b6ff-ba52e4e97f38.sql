
-- Fix instituciones: drop all RESTRICTIVE policies and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Members can view instituciones" ON instituciones;
DROP POLICY IF EXISTS "Authenticated can create instituciones" ON instituciones;
DROP POLICY IF EXISTS "Admins can update instituciones" ON instituciones;
DROP POLICY IF EXISTS "Admins can delete instituciones" ON instituciones;

CREATE POLICY "Members can view instituciones" ON instituciones
FOR SELECT TO authenticated
USING (is_institucion_member(auth.uid(), id));

CREATE POLICY "Authenticated can create instituciones" ON instituciones
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update instituciones" ON instituciones
FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM profesor_institucion
  WHERE profesor_institucion.user_id = auth.uid()
    AND profesor_institucion.institucion_id = instituciones.id
    AND profesor_institucion.rol = 'administrador'
));

CREATE POLICY "Admins can delete instituciones" ON instituciones
FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM profesor_institucion
  WHERE profesor_institucion.user_id = auth.uid()
    AND profesor_institucion.institucion_id = instituciones.id
    AND profesor_institucion.rol = 'administrador'
));

-- Fix profesor_institucion: drop all RESTRICTIVE policies and recreate as PERMISSIVE
DROP POLICY IF EXISTS "Users can view own memberships" ON profesor_institucion;
DROP POLICY IF EXISTS "Users can insert own memberships" ON profesor_institucion;
DROP POLICY IF EXISTS "Users can update own memberships" ON profesor_institucion;
DROP POLICY IF EXISTS "Users can delete own memberships" ON profesor_institucion;

CREATE POLICY "Users can view own memberships" ON profesor_institucion
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memberships" ON profesor_institucion
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memberships" ON profesor_institucion
FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own memberships" ON profesor_institucion
FOR DELETE TO authenticated
USING (auth.uid() = user_id);
