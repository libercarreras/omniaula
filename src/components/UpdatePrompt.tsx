import { useEffect, useRef } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "sonner";

export function UpdatePrompt() {
  const toastShown = useRef(false);

  useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      console.log("[OmniAula][SW] Registrado:", swUrl);
      // Poll for updates every 60s
      if (registration) {
        setInterval(() => registration.update(), 60_000);
      }
    },
    onRegisterError(error) {
      console.error("[OmniAula][SW] Error de registro:", error);
    },
  });

  // Show toast once after a SW-triggered reload
  useEffect(() => {
    if (toastShown.current) return;
    const updated = sessionStorage.getItem("omniaula_sw_updated");
    if (updated) {
      sessionStorage.removeItem("omniaula_sw_updated");
      toastShown.current = true;
      toast.success("App actualizada a la última versión", { duration: 3000 });
    }
  }, []);

  // Set flag before SW reload so toast shows after
  useEffect(() => {
    const onControllerChange = () => {
      sessionStorage.setItem("omniaula_sw_updated", "1");
    };
    navigator.serviceWorker?.addEventListener("controllerchange", onControllerChange);
    return () => {
      navigator.serviceWorker?.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  return null;
}
