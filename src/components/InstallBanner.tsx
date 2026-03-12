import { useState } from "react";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

const DISMISS_KEY = "pwa-install-dismissed";

export function InstallBanner() {
  const { canInstall, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISS_KEY) === "1"
  );

  if (!canInstall || dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9999] mx-auto max-w-md animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-start gap-3 rounded-xl border bg-card p-4 shadow-lg">
        <Download className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium text-foreground">
            Instalá OmniAula en tu dispositivo
          </p>
          <p className="text-xs text-muted-foreground">
            Accedé más rápido y usá la app sin conexión.
          </p>
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={promptInstall} className="gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Instalar
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss}>
              Ahora no
            </Button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
