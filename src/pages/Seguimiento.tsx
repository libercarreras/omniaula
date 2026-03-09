import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { observaciones } from "@/data/mockData";

const tipoLabel: Record<string, { label: string; variant: "default" | "destructive" | "secondary" }> = {
  comportamiento: { label: "Comportamiento", variant: "destructive" },
  academico: { label: "Académico", variant: "secondary" },
  positivo: { label: "Positivo", variant: "default" },
};

export default function Seguimiento() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Seguimiento</h1>
        <Button size="lg" className="gap-2">
          <Plus className="h-4 w-4" /> Nueva observación
        </Button>
      </div>
      <div className="space-y-3">
        {observaciones.map((obs) => (
          <Card key={obs.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <p className="font-semibold">{obs.estudianteNombre}</p>
                <Badge variant={tipoLabel[obs.tipo].variant}>
                  {tipoLabel[obs.tipo].label}
                </Badge>
              </div>
              <p className="text-sm">{obs.nota}</p>
              <p className="text-xs text-muted-foreground mt-2">{obs.fecha}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
