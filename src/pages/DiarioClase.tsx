import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { diarioClase, getClaseLabel } from "@/data/mockData";

export default function DiarioClase() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Diario de Clase</h1>
        <Button size="lg" className="gap-2">
          <Plus className="h-4 w-4" /> Nueva entrada
        </Button>
      </div>
      <div className="space-y-3">
        {diarioClase.map((entry) => (
          <Card key={entry.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold">{getClaseLabel(entry.claseId)}</p>
                <span className="text-sm text-muted-foreground">{entry.fecha}</span>
              </div>
              <p className="text-sm mb-2">{entry.descripcion}</p>
              <div className="flex gap-2 flex-wrap">
                {entry.temas.map((tema) => (
                  <Badge key={tema} variant="secondary">{tema}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
