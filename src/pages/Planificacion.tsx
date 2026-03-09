import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { planificaciones } from "@/data/mockData";

const estadoConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  pendiente: { label: "Pendiente", variant: "secondary" },
  en_curso: { label: "En curso", variant: "default" },
  completada: { label: "Completada", variant: "secondary" },
};

export default function Planificacion() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Planificación</h1>
        <Button size="lg" className="gap-2">
          <Plus className="h-4 w-4" /> Nueva planificación
        </Button>
      </div>
      <div className="space-y-3">
        {planificaciones.map((plan) => (
          <Card key={plan.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold">{plan.grupoNombre} — {plan.periodo}</p>
                  <p className="text-sm text-muted-foreground mt-1">{plan.objetivo}</p>
                </div>
                <Badge variant={estadoConfig[plan.estado].variant}>
                  {estadoConfig[plan.estado].label}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
