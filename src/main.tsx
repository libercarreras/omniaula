import { createRoot } from "react-dom/client";
import { supabase } from "@/integrations/supabase/client";
import App from "./App.tsx";
import "./index.css";

// Enforce Spanish lang & block browser auto-translation at runtime
document.documentElement.lang = "es";
document.documentElement.setAttribute("translate", "no");
document.documentElement.classList.add("notranslate");

// Global error handlers — capture unhandled crashes (especially on Android)
window.onerror = (message, source, lineno, colno, error) => {
  console.error(
    "[OmniAula][GlobalError]", message,
    "| Source:", source, ":", lineno, ":", colno,
    "| Error:", error?.stack,
    "| UA:", navigator.userAgent,
    "| Lang:", document.documentElement.lang,
    "| NavLang:", navigator.language,
    "| Timestamp:", new Date().toISOString()
  );
};

window.onunhandledrejection = (event) => {
  console.error(
    "[OmniAula][UnhandledRejection]", event.reason,
    "| UA:", navigator.userAgent,
    "| Timestamp:", new Date().toISOString()
  );
};

// Unregister service workers in preview/iframe contexts
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if (isPreviewHost || isInIframe) {
  navigator.serviceWorker?.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
}

createRoot(document.getElementById("root")!).render(<App />);
