-- Create table to store global application settings such as default language
CREATE TABLE IF NOT EXISTS public.app_settings (
  id integer PRIMARY KEY CHECK (id = 1),
  default_language text NOT NULL CHECK (default_language IN ('tr', 'en', 'ru', 'bg')),
  updated_by uuid REFERENCES public.profiles(id),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Ensure a singleton row exists with sensible defaults
INSERT INTO public.app_settings (id, default_language)
VALUES (1, 'tr')
ON CONFLICT (id) DO NOTHING;

-- Enable row level security so only authorised users can modify settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Any authenticated user should be able to read settings (used by clients on startup)
CREATE POLICY "App settings are readable" ON public.app_settings
  FOR SELECT
  TO public
  USING (true);

-- Only admins may update the settings
CREATE POLICY "Only admins can update app settings" ON public.app_settings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- Prevent insert/delete operations through RLS – singleton row is managed via migration
CREATE POLICY "No inserts into app settings" ON public.app_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "No deletes from app settings" ON public.app_settings
  FOR DELETE
  TO authenticated
  USING (false);

-- Keep updated_at fresh automatically
CREATE OR REPLACE FUNCTION public.update_app_settings_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS app_settings_set_timestamp ON public.app_settings;
CREATE TRIGGER app_settings_set_timestamp
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_app_settings_timestamp();
