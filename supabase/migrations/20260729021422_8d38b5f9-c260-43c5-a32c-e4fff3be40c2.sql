CREATE OR REPLACE FUNCTION public.user_id_for_email(_email text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id
  FROM auth.users u
  WHERE lower(u.email) = lower(_email)
  LIMIT 1
$$;

REVOKE ALL ON FUNCTION public.user_id_for_email(text) FROM public;
REVOKE ALL ON FUNCTION public.user_id_for_email(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.user_id_for_email(text) TO service_role;