
-- Create enum for invitation status
CREATE TYPE public.estado_invitacion AS ENUM ('pendiente', 'aceptada', 'rechazada');

-- Create collaboration table
CREATE TABLE public.grupo_colaboradores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id uuid NOT NULL REFERENCES public.grupos(id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL,
  colaborador_user_id uuid NOT NULL,
  estado estado_invitacion NOT NULL DEFAULT 'pendiente',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(grupo_id, colaborador_user_id)
);

ALTER TABLE public.grupo_colaboradores ENABLE ROW LEVEL SECURITY;

-- Owner can do everything with their invitations
CREATE POLICY "Owner can manage invitations"
ON public.grupo_colaboradores
FOR ALL
TO authenticated
USING (auth.uid() = owner_user_id)
WITH CHECK (auth.uid() = owner_user_id);

-- Colaborador can view invitations sent to them
CREATE POLICY "Colaborador can view own invitations"
ON public.grupo_colaboradores
FOR SELECT
TO authenticated
USING (auth.uid() = colaborador_user_id);

-- Colaborador can update (accept/reject) invitations sent to them
CREATE POLICY "Colaborador can update own invitations"
ON public.grupo_colaboradores
FOR UPDATE
TO authenticated
USING (auth.uid() = colaborador_user_id);

-- Security definer function to check if user is a collaborator of a group
CREATE OR REPLACE FUNCTION public.is_grupo_colaborador(_user_id uuid, _grupo_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.grupo_colaboradores
    WHERE colaborador_user_id = _user_id
      AND grupo_id = _grupo_id
      AND estado = 'aceptada'
  )
$$;

-- Add policy so collaborators can read students from shared groups
CREATE POLICY "Collaborators can view shared students"
ON public.estudiantes
FOR SELECT
TO authenticated
USING (public.is_grupo_colaborador(auth.uid(), grupo_id));

-- Allow admins to read all profiles (for invitation search)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow authenticated users to search profiles by email (for invitations)
CREATE POLICY "Users can search profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Enable realtime for grupo_colaboradores
ALTER PUBLICATION supabase_realtime ADD TABLE public.grupo_colaboradores;
