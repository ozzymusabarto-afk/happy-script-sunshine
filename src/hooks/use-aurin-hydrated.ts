import { useEffect, useState } from "react";
import { useAurinStore } from "@/store/aurin-store";

/** Reidrata o estado persistido só depois da hidratação do React (evita mismatch de SSR). */
export function useAurinHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.resolve(useAurinStore.persist.rehydrate()).then(() => {
      if (active) setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, []);

  return hydrated;
}
