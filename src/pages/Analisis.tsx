import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default function Analisis() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-display font-bold">Análisis</h1>
      <Card>
        <CardContent className="p-12 flex flex-col items-center text-center">
          <BarChart3 className="h-16 w-16 text-muted-foreground/40 mb-4" />
          <h2 className="font-display font-semibold text-lg mb-2">Estadísticas y gráficos</h2>
          <p className="text-muted-foreground max-w-md">
            Próximamente podrás visualizar estadísticas de asistencia, evaluaciones y rendimiento de tus grupos y estudiantes.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
