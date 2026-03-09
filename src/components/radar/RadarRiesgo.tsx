import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { mockEstudiantesEnRiesgo } from "@/data/mockAnalytics";

export function RadarRiesgo() {
  if (mockEstudiantesEnRiesgo.length === 0) return null;

  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Estudiantes que requieren atención
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Detectados automáticamente según asistencia, notas y participación
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {mockEstudiantesEnRiesgo.map((est) => (
          <div
            key={est.id}
            className="p-3 rounded-lg bg-background border border-destructive/20"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-sm">{est.nombre}</p>
              <div className="flex gap-1.5">
                <Badge variant="destructive" className="text-[10px]">
                  Asist. {est.asistencia}%
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  Prom. {est.promedio}
                </Badge>
              </div>
            </div>
            <ul className="space-y-0.5 mb-2">
              {est.motivos.map((m, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                  <span className="text-destructive mt-0.5">•</span> {m}
                </li>
              ))}
            </ul>
            <div className="bg-primary/5 p-2 rounded text-xs">
              <span className="font-medium text-primary">Sugerencia:</span>{" "}
              {est.recomendacion}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
