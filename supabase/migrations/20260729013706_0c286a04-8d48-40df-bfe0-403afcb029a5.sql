CREATE TABLE public.premium_status (
  email TEXT PRIMARY KEY,
  user_id UUID,
  plan TEXT NOT NULL DEFAULT 'monthly',
  active BOOLEAN NOT NULL DEFAULT false,
  transaction TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.premium_status TO authenticated;
GRANT ALL ON public.premium_status TO service_role;

ALTER TABLE public.premium_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own premium status"
ON public.premium_status
FOR SELECT
TO authenticated
USING (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

CREATE TRIGGER premium_status_set_updated_at
BEFORE UPDATE ON public.premium_status
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();