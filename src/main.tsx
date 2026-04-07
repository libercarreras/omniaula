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

// PWA manifest is handled by VitePWA plugin

createRoot(document.getElementById("root")!).render(<App />);

// Dynamic manifest injection: if custom PWA icons exist in app_settings,
// replace the static manifest link with the dynamic-manifest Edge Function URL.
setTimeout(async () => {
  try {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data } = await supabase
      .from("app_settings")
      .select("key")
      .in("key", ["pwa_icon_192", "pwa_icon_512"])
      .limit(1);

    if (data && data.length > 0) {
      const manifestLink = document.querySelector('link[rel="manifest"]');
      if (manifestLink) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        manifestLink.setAttribute(
          "href",
          `${supabaseUrl}/functions/v1/dynamic-manifest`
        );
      }
    }
  } catch (e) {
    console.warn("[OmniAula] Dynamic manifest check failed:", e);
  }
}, 3000);
