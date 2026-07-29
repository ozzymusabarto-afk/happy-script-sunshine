CREATE INDEX IF NOT EXISTS premium_status_user_id_idx ON public.premium_status (user_id);

DROP POLICY IF EXISTS "Users can read their own premium status" ON public.premium_status;

CREATE POLICY "Users can read their own premium status"
ON public.premium_status
FOR SELECT
TO authenticated
USING (
  (user_id IS NOT NULL AND user_id = auth.uid())
  OR (
    user_id IS NULL
    AND coalesce(auth.jwt() ->> 'email', '') <> ''
    AND lower(email) = lower(auth.jwt() ->> 'email')
    AND coalesce(
      (auth.jwt() -> 'user_metadata' ->> 'email_verified')::boolean,
      false
    )
  )
);