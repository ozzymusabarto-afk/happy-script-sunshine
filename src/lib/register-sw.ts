/**
 * Registro do service worker (modo offline) com trava de segurança:
 * nunca registra no editor/preview do Lovable nem em desenvolvimento.
 */
export function registerServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

  const host = window.location.hostname;
  const blocked =
    !import.meta.env.PROD ||
    window.self !== window.top ||
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host === "lovableproject.com" ||
    host.endsWith(".lovableproject.com") ||
    host === "lovableproject-dev.com" ||
    host.endsWith(".lovableproject-dev.com") ||
    host === "beta.lovable.dev" ||
    host.endsWith(".beta.lovable.dev") ||
    new URLSearchParams(window.location.search).has("sw") ;

  if (blocked) {
    void navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => {
        if (reg.active?.scriptURL.endsWith("/sw.js")) void reg.unregister();
      });
    });
    return;
  }

  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      /* offline é um bônus: se falhar, o app segue normal */
    });
  });
}
