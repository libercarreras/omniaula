import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { evaluaciones } from "@/data/mockData";

const tipoColor: Record<string, string> = {
  parcial: "bg-primary/10 text-primary",
  trabajo: "bg-accent/10 text-accent",
  oral: "bg-warning/10 text-warning",
  tarea: "bg-muted text-muted-foreground",
};

export default function Evaluaciones() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Evaluaciones</h1>
        <Button size="lg" className="gap-2">
          <Plus className="h-4 w-4" /> Nueva evaluación
        </Button>
      </div>
      <div className="space-y-3">
        {evaluaciones.map((ev) => (
          <Card key={ev.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">{ev.titulo}</p>
                <p className="text-sm text-muted-foreground">{ev.grupoNombre} · {ev.fecha}</p>
              </div>
              <Badge className={tipoColor[ev.tipo]} variant="secondary">
                {ev.tipo.charAt(0).toUpperCase() + ev.tipo.slice(1)}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
