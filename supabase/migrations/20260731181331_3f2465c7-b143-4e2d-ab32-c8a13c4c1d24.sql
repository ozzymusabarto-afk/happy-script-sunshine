REVOKE EXECUTE ON FUNCTION public.user_id_for_email(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.user_id_for_email(text) TO service_role;