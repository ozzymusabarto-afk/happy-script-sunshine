CREATE TABLE public.aurin_backups (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  payload JSONB NOT NULL,
  device_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.aurin_backups TO authenticated;
GRANT ALL ON public.aurin_backups TO service_role;

ALTER TABLE public.aurin_backups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own backup"
  ON public.aurin_backups FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER aurin_backups_updated_at
  BEFORE UPDATE ON public.aurin_backups
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();