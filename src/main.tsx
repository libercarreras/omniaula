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
