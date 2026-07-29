CREATE OR REPLACE FUNCTION public.current_verified_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(u.email)
  FROM auth.users u
  WHERE u.id = auth.uid()
    AND u.email_confirmed_at IS NOT NULL
$$;

REVOKE ALL ON FUNCTION public.current_verified_email() FROM public;
GRANT EXECUTE ON FUNCTION public.current_verified_email() TO authenticated;

DROP POLICY IF EXISTS "Users can read their own premium status" ON public.premium_status;

CREATE POLICY "Users can read their own premium status"
ON public.premium_status
FOR SELECT
TO authenticated
USING (
  (user_id IS NOT NULL AND user_id = auth.uid())
  OR (
    user_id IS NULL
    AND lower(email) = public.current_verified_email()
  )
);