REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;

GRANT SELECT ON public.admin_allowlist TO authenticated;
CREATE POLICY "Admins can read the allowlist"
ON public.admin_allowlist FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));