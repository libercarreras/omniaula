
-- 1. Fix RLS policies for instituciones (bug: was comparing profesor_institucion.institucion_id = profesor_institucion.id)
DROP POLICY IF EXISTS "Admins can update instituciones" ON instituciones;
DROP POLICY IF EXISTS "Admins can delete instituciones" ON instituciones;

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

-- 2. Separate shared institutions: duplicate for each professor who shares one
DO $$
DECLARE
  r RECORD;
  new_inst_id uuid;
BEGIN
  -- Find profesor_institucion rows where the institucion has multiple members
  FOR r IN
    SELECT pi.id as pi_id, pi.user_id, pi.institucion_id, pi.rol,
           i.nombre, i.direccion, i.ciudad
    FROM profesor_institucion pi
    JOIN instituciones i ON i.id = pi.institucion_id
    WHERE pi.institucion_id IN (
      SELECT institucion_id FROM profesor_institucion GROUP BY institucion_id HAVING COUNT(*) > 1
    )
    -- Keep the original for the institution creator (user_id on instituciones), duplicate for others
    AND pi.user_id != i.user_id
  LOOP
    -- Create a copy of the institution for this professor
    INSERT INTO instituciones (nombre, direccion, ciudad, user_id)
    VALUES (r.nombre, r.direccion, r.ciudad, r.user_id)
    RETURNING id INTO new_inst_id;

    -- Update this professor's membership to point to the new institution
    UPDATE profesor_institucion SET institucion_id = new_inst_id WHERE id = r.pi_id;

    -- Move this professor's grupos from the old institution to the new one
    UPDATE grupos SET institucion_id = new_inst_id
    WHERE institucion_id = r.institucion_id AND user_id = r.user_id;
  END LOOP;
END $$;

-- 3. Add CASCADE delete from instituciones -> profesor_institucion
ALTER TABLE profesor_institucion DROP CONSTRAINT IF EXISTS profesor_institucion_institucion_id_fkey;
ALTER TABLE profesor_institucion ADD CONSTRAINT profesor_institucion_institucion_id_fkey
  FOREIGN KEY (institucion_id) REFERENCES instituciones(id) ON DELETE CASCADE;

-- 4. Add CASCADE delete from instituciones -> grupos
ALTER TABLE grupos DROP CONSTRAINT IF EXISTS grupos_institucion_id_fkey;
ALTER TABLE grupos ADD CONSTRAINT grupos_institucion_id_fkey
  FOREIGN KEY (institucion_id) REFERENCES instituciones(id) ON DELETE CASCADE;

-- 5. Trigger to auto-create institution for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_institucion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  new_inst_id uuid;
BEGIN
  INSERT INTO public.instituciones (nombre, user_id)
  VALUES ('Mi Institución', NEW.id)
  RETURNING id INTO new_inst_id;

  INSERT INTO public.profesor_institucion (user_id, institucion_id, rol)
  VALUES (NEW.id, new_inst_id, 'administrador');

  RETURN NEW;
END;
$fn$;

CREATE TRIGGER on_auth_user_created_institucion
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_institucion();
