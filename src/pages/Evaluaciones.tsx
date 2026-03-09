import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, ClipboardCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const tipoLabel: Record<string, string> = {
  prueba_escrita: "Prueba escrita",
  oral: "Oral",
  trabajo_practico: "Trabajo práctico",
  laboratorio: "Laboratorio",
  tarea: "Tarea",
  evaluacion_formativa: "Formativa",
};

const tipoColor: Record<string, string> = {
  prueba_escrita: "bg-primary/10 text-primary",
  oral: "bg-warning/10 text-warning",
  trabajo_practico: "bg-accent/10 text-accent",
  laboratorio: "bg-success/10 text-success",
  tarea: "bg-muted text-muted-foreground",
  evaluacion_formativa: "bg-secondary text-secondary-foreground",
};

export default function Evaluaciones() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [evaluaciones, setEvaluaciones] = useState<any[]>([]);
  const [materias, setMaterias] = useState<Record<string, string>>({});
  const [grupos, setGrupos] = useState<Record<string, string>>({});
  const [clases, setClases] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const [evRes, clsRes, matRes, grpRes] = await Promise.all([
        supabase.from("evaluaciones").select("*").order("fecha", { ascending: false }),
        supabase.from("clases").select("id, materia_id, grupo_id"),
        supabase.from("materias").select("id, nombre"),
        supabase.from("grupos").select("id, nombre"),
      ]);
      setEvaluaciones(evRes.data || []);
      setClases(clsRes.data || []);
      const mm: Record<string, string> = {};
      (matRes.data || []).forEach(m => { mm[m.id] = m.nombre; });
      setMaterias(mm);
      const gm: Record<string, string> = {};
      (grpRes.data || []).forEach(g => { gm[g.id] = g.nombre; });
      setGrupos(gm);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const getClaseLabel = (claseId: string) => {
    const c = clases.find(cl => cl.id === claseId);
    if (!c) return "Clase desconocida";
    return `${materias[c.materia_id] || "?"} - ${grupos[c.grupo_id] || "?"}`;
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Evaluaciones</h1>
        <Button size="lg" className="gap-2"><Plus className="h-4 w-4" /> Nueva evaluación</Button>
      </div>

      {evaluaciones.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-3">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No hay evaluaciones creadas aún.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {evaluaciones.map(ev => (
            <Card key={ev.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{ev.nombre}</p>
                  <p className="text-sm text-muted-foreground">{getClaseLabel(ev.clase_id)} · {ev.fecha || "Sin fecha"}</p>
                </div>
                <Badge className={tipoColor[ev.tipo] || ""} variant="secondary">
                  {tipoLabel[ev.tipo] || ev.tipo}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
