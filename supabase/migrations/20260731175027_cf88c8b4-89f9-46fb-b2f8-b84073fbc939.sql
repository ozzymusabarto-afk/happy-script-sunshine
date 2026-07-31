CREATE TABLE public.app_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  event text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.app_events TO authenticated;
GRANT ALL ON public.app_events TO service_role;

ALTER TABLE public.app_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read events"
ON public.app_events FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE INDEX app_events_created_at_idx ON public.app_events (created_at DESC);
CREATE INDEX app_events_event_idx ON public.app_events (event);

CREATE OR REPLACE FUNCTION public.admin_metrics()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  SELECT jsonb_build_object(
    'accounts', (SELECT count(*) FROM auth.users),
    'accounts_new_7d', (SELECT count(*) FROM auth.users WHERE created_at > now() - interval '7 days'),
    'accounts_new_30d', (SELECT count(*) FROM auth.users WHERE created_at > now() - interval '30 days'),
    'cloud_backups', (SELECT count(*) FROM public.aurin_backups),
    'premium_active', (SELECT count(*) FROM public.premium_status WHERE active AND (expires_at IS NULL OR expires_at > now())),
    'premium_inactive', (SELECT count(*) FROM public.premium_status WHERE NOT active OR (expires_at IS NOT NULL AND expires_at <= now())),
    'premium_monthly', (SELECT count(*) FROM public.premium_status WHERE active AND plan = 'monthly'),
    'premium_yearly', (SELECT count(*) FROM public.premium_status WHERE active AND plan = 'yearly'),
    'opens_today', (SELECT count(*) FROM public.app_events WHERE event = 'app_open' AND created_at > date_trunc('day', now())),
    'opens_7d', (SELECT count(*) FROM public.app_events WHERE event = 'app_open' AND created_at > now() - interval '7 days'),
    'opens_30d', (SELECT count(*) FROM public.app_events WHERE event = 'app_open' AND created_at > now() - interval '30 days'),
    'premium_views', (SELECT count(*) FROM public.app_events WHERE event = 'premium_view'),
    'checkout_clicks', (SELECT count(*) FROM public.app_events WHERE event = 'checkout_click'),
    'activations', (SELECT count(*) FROM public.app_events WHERE event = 'premium_activated')
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_metrics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_metrics() TO authenticated;