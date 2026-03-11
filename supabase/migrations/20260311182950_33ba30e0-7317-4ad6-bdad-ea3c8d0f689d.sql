
-- Table app_settings (global key-value store)
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read
CREATE POLICY "app_settings_select" ON public.app_settings
  FOR SELECT TO authenticated USING (true);

-- Only admins can insert
CREATE POLICY "app_settings_insert" ON public.app_settings
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update
CREATE POLICY "app_settings_update" ON public.app_settings
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete
CREATE POLICY "app_settings_delete" ON public.app_settings
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Public storage bucket for app assets (PWA icons etc)
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-assets', 'app-assets', true);

-- Anyone can read from app-assets
CREATE POLICY "app_assets_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'app-assets');

-- Only admins can upload to app-assets
CREATE POLICY "app_assets_admin_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'app-assets' AND public.has_role(auth.uid(), 'admin'));

-- Only admins can update in app-assets
CREATE POLICY "app_assets_admin_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'app-assets' AND public.has_role(auth.uid(), 'admin'));

-- Only admins can delete from app-assets
CREATE POLICY "app_assets_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'app-assets' AND public.has_role(auth.uid(), 'admin'));
