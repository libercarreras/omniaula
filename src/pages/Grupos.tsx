import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { grupos, clases, materias } from "@/data/mockData";

export default function Grupos() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Grupos</h1>
        <Button size="lg" className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo grupo
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {grupos.map((grupo) => {
          const clasesGrupo = clases.filter((c) => c.grupoId === grupo.id);
          return (
            <Card key={grupo.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display font-bold text-xl">{grupo.nombre}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {clasesGrupo.map((c) => materias.find((m) => m.id === c.materiaId)?.nombre).join(", ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-sm bg-muted rounded-full px-3 py-1">
                    <Users className="h-3.5 w-3.5" />
                    {grupo.cantidadEstudiantes}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
