import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen } from "lucide-react";
import { materias, clases, grupos } from "@/data/mockData";

export default function Materias() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Materias</h1>
        <Button size="lg" className="gap-2">
          <Plus className="h-4 w-4" /> Nueva materia
        </Button>
      </div>
      <div className="space-y-4">
        {materias.map((materia) => {
          const clasesMateria = clases.filter((c) => c.materiaId === materia.id);
          return (
            <Card key={materia.id}>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h3 className="font-display font-bold text-lg">{materia.nombre}</h3>
                  <Badge variant="secondary">{clasesMateria.length} clases</Badge>
                </div>
                <div className="space-y-2">
                  {clasesMateria.map((clase) => {
                    const grupo = grupos.find((g) => g.id === clase.grupoId);
                    return (
                      <div key={clase.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-semibold">{grupo?.nombre}</p>
                          <p className="text-sm text-muted-foreground">{clase.horario}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{clase.aula}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
