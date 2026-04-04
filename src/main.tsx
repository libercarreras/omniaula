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

// Delay dynamic manifest injection so Chrome can capture beforeinstallprompt first
setTimeout(async () => {
  try {
    const { data } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["pwa_icon_192", "pwa_icon_512"]);

    if (!data || data.length === 0) return;

    const icons: Record<string, string> = {};
    data.forEach((s: any) => { icons[s.key] = s.value; });

    if (!icons.pwa_icon_192 && !icons.pwa_icon_512) return;

    const manifest = {
      id: "/",
      name: "OmniAula — Aula inteligente",
      short_name: "OmniAula",
      description: "Aula inteligente para Profesores",
      theme_color: "#2B5EA7",
      background_color: "#f5f7fa",
      display: "standalone",
      orientation: "portrait",
      start_url: "/",
      scope: "/",
      icons: [
        { src: icons.pwa_icon_192 || "/pwa-icon-192.png", sizes: "192x192", type: "image/png" },
        { src: icons.pwa_icon_512 || "/pwa-icon-512.png", sizes: "512x512", type: "image/png" },
        { src: icons.pwa_icon_512 || "/pwa-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
    };

    const blob = new Blob([JSON.stringify(manifest)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.querySelector('link[rel="manifest"]');
    if (link) link.setAttribute("href", url);
  } catch (e) {
    // Silently fail - fallback to static manifest
  }
}, 3000);

createRoot(document.getElementById("root")!).render(<App />);
