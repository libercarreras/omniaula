
-- 1. Create instituciones table
CREATE TABLE public.instituciones (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  direccion text,
  ciudad text,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 2. Create profesor_institucion table
CREATE TABLE public.profesor_institucion (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  institucion_id uuid NOT NULL REFERENCES public.instituciones(id) ON DELETE CASCADE,
  rol text NOT NULL DEFAULT 'profesor',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Unique constraint
ALTER TABLE public.profesor_institucion ADD CONSTRAINT profesor_institucion_unique UNIQUE (user_id, institucion_id);

-- 3. Add institucion_id to grupos (nullable initially)
ALTER TABLE public.grupos ADD COLUMN institucion_id uuid REFERENCES public.instituciones(id);

-- 4. Add apellido to estudiantes
ALTER TABLE public.estudiantes ADD COLUMN apellido text;

-- 5. Migrate existing data: create default institution per user
INSERT INTO public.instituciones (id, nombre, user_id)
SELECT gen_random_uuid(), 'Institución Principal', DISTINCT_USERS.user_id
FROM (SELECT DISTINCT user_id FROM public.grupos) AS DISTINCT_USERS;

-- Insert profesor_institucion for each user
INSERT INTO public.profesor_institucion (user_id, institucion_id, rol)
SELECT i.user_id, i.id, 'administrador'
FROM public.instituciones i;

-- Update grupos with their user's default institution
UPDATE public.grupos g
SET institucion_id = (
  SELECT i.id FROM public.instituciones i WHERE i.user_id = g.user_id LIMIT 1
);

-- 6. Make institucion_id NOT NULL
ALTER TABLE public.grupos ALTER COLUMN institucion_id SET NOT NULL;

-- 7. Create security definer function
CREATE OR REPLACE FUNCTION public.is_institucion_member(_user_id uuid, _institucion_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profesor_institucion
    WHERE user_id = _user_id
      AND institucion_id = _institucion_id
  )
$$;

-- 8. RLS for instituciones
ALTER TABLE public.instituciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view instituciones"
ON public.instituciones FOR SELECT
TO authenticated
USING (public.is_institucion_member(auth.uid(), id));

CREATE POLICY "Authenticated can create instituciones"
ON public.instituciones FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update instituciones"
ON public.instituciones FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profesor_institucion
    WHERE user_id = auth.uid() AND institucion_id = id AND rol = 'administrador'
  )
);

CREATE POLICY "Admins can delete instituciones"
ON public.instituciones FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profesor_institucion
    WHERE user_id = auth.uid() AND institucion_id = id AND rol = 'administrador'
  )
);

-- 9. RLS for profesor_institucion
ALTER TABLE public.profesor_institucion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own memberships"
ON public.profesor_institucion FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memberships"
ON public.profesor_institucion FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memberships"
ON public.profesor_institucion FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own memberships"
ON public.profesor_institucion FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 10. Add RLS policy for grupos: institution members can view
CREATE POLICY "Institution members can view grupos"
ON public.grupos FOR SELECT
TO authenticated
USING (public.is_institucion_member(auth.uid(), institucion_id));

-- Updated_at trigger for instituciones
CREATE TRIGGER update_instituciones_updated_at
  BEFORE UPDATE ON public.instituciones
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
