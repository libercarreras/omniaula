import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function InstallPWAButton() {
  const { canInstall, promptInstall } = useInstallPrompt();

  if (!canInstall) return null;

  return (
    <Button onClick={promptInstall} className="gap-2" size="sm">
      <Download className="h-4 w-4" /> Instalar app
    </Button>
  );
}
