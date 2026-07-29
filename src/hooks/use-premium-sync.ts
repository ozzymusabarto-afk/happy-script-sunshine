import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { getPremiumStatus } from "@/lib/premium.functions";
import { useAurinStore } from "@/store/aurin-store";

/**
 * Confere na nuvem se a compra na Hotmart já foi aprovada e, em caso
 * positivo, libera o Premium neste aparelho.
 */
export function usePremiumSync() {
  const setPlan = useAurinStore((s) => s.setPlan);
  const [checking, setChecking] = useState(false);

  const check = useCallback(async () => {
    setChecking(true);
    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return { signedIn: false, active: false };
      const status = await getPremiumStatus();
      if (status.active) setPlan("premium");
      return { signedIn: true, active: status.active };
    } catch (error) {
      console.error("[premium] verificação falhou", error);
      return { signedIn: true, active: false };
    } finally {
      setChecking(false);
    }
  }, [setPlan]);

  return { check, checking };
}

/** Verifica uma vez ao abrir o app e sempre que a sessão mudar. */
export function usePremiumAutoSync() {
  const { check } = usePremiumSync();

  useEffect(() => {
    void check();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "USER_UPDATED") void check();
    });
    return () => data.subscription.unsubscribe();
  }, [check]);
}
