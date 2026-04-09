
-- 1. Ensure triggers exist (idempotent: drop if exists, then create)

-- Trigger: auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger: auto-assign docente role on signup
DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- Trigger: auto-create institution + membership on signup
DROP TRIGGER IF EXISTS on_auth_user_created_institucion ON auth.users;
CREATE TRIGGER on_auth_user_created_institucion
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_institucion();

-- 2. Backfill: create missing profiles
INSERT INTO public.profiles (user_id, nombre, email, plan)
SELECT u.id, COALESCE(u.raw_user_meta_data->>'nombre', ''), u.email, 'free'
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
WHERE p.id IS NULL;

-- 3. Backfill: assign docente role to users missing any role
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'docente'
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
WHERE ur.id IS NULL;

-- 4. Backfill: create institution + membership for users without any
INSERT INTO public.instituciones (nombre, user_id)
SELECT 'Mi Institución', u.id
FROM auth.users u
LEFT JOIN public.profesor_institucion pi ON pi.user_id = u.id
WHERE pi.id IS NULL;

INSERT INTO public.profesor_institucion (user_id, institucion_id, rol)
SELECT i.user_id, i.id, 'administrador'
FROM public.instituciones i
LEFT JOIN public.profesor_institucion pi ON pi.user_id = i.user_id AND pi.institucion_id = i.id
WHERE pi.id IS NULL
  AND i.nombre = 'Mi Institución';
