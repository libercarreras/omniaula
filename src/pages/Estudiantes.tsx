import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { estudiantes, grupos } from "@/data/mockData";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Estudiantes() {
  const [filtroGrupo, setFiltroGrupo] = useState("todos");

  const estudiantesFiltrados = filtroGrupo === "todos"
    ? estudiantes
    : estudiantes.filter((e) => e.grupoId === filtroGrupo);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-display font-bold">Estudiantes</h1>
        <Select value={filtroGrupo} onValueChange={setFiltroGrupo}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filtrar grupo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {grupos.map((g) => (
              <SelectItem key={g.id} value={g.id}>{g.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-3">
        {estudiantesFiltrados.map((est) => (
          <Card key={est.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold">{est.apellido}, {est.nombre}</p>
                <p className="text-sm text-muted-foreground">{est.grupoNombre}</p>
              </div>
              {est.enRiesgo && <Badge variant="destructive">En riesgo</Badge>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
