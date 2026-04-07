import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ImageIcon, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ConfiguracionTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-primary" />
          Icono de la aplicación (PWA)
        </CardTitle>
        <CardDescription>
          Personalización del icono que aparece al instalar la app.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            La personalización del icono PWA está temporalmente deshabilitada mientras se implementa una solución más robusta.
            El icono por defecto se usa al instalar la app.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
