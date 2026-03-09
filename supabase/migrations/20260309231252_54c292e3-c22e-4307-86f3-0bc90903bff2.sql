DROP POLICY "Authenticated can create instituciones" ON instituciones;

CREATE POLICY "Authenticated can create instituciones" ON instituciones
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);