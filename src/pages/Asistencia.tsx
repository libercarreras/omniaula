import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { grupos, estudiantes } from "@/data/mockData";
import { useState } from "react";
import { Check, X, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type EstadoAsistencia = "presente" | "ausente" | "tardanza" | null;

export default function Asistencia() {
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(grupos[0].id);
  const [asistencia, setAsistencia] = useState<Record<string, EstadoAsistencia>>({});

  const estudiantesGrupo = estudiantes.filter((e) => e.grupoId === grupoSeleccionado);

  const marcar = (estudianteId: string, estado: EstadoAsistencia) => {
    setAsistencia((prev) => ({ ...prev, [estudianteId]: prev[estudianteId] === estado ? null : estado }));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-display font-bold">Asistencia</h1>

      <div className="flex gap-3 flex-wrap">
        <Select value={grupoSeleccionado} onValueChange={setGrupoSeleccionado}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {grupos.map((g) => (
              <SelectItem key={g.id} value={g.id}>{g.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground self-center">9 de marzo, 2026</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">
            {grupos.find((g) => g.id === grupoSeleccionado)?.nombre} — {estudiantesGrupo.length} estudiantes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {estudiantesGrupo.map((est) => {
            const estado = asistencia[est.id];
            return (
              <div key={est.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <span className="font-medium">{est.apellido}, {est.nombre}</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={estado === "presente" ? "default" : "outline"}
                    className={cn("h-10 w-10 p-0", estado === "presente" && "bg-success hover:bg-success/90")}
                    onClick={() => marcar(est.id, "presente")}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={estado === "ausente" ? "default" : "outline"}
                    className={cn("h-10 w-10 p-0", estado === "ausente" && "bg-destructive hover:bg-destructive/90")}
                    onClick={() => marcar(est.id, "ausente")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={estado === "tardanza" ? "default" : "outline"}
                    className={cn("h-10 w-10 p-0", estado === "tardanza" && "bg-warning hover:bg-warning/90")}
                    onClick={() => marcar(est.id, "tardanza")}
                  >
                    <Clock className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Button size="lg" className="w-full md:w-auto">Guardar asistencia</Button>
    </div>
  );
}
