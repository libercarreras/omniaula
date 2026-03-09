import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const tipoLabel: Record<string, { label: string; variant: "default" | "destructive" | "secondary" }> = {
  participacion: { label: "Participación", variant: "default" },
  actitud: { label: "Actitud", variant: "destructive" },
  cumplimiento_tareas: { label: "Tareas", variant: "secondary" },
  dificultad_contenidos: { label: "Dificultad", variant: "secondary" },
};

export default function Seguimiento() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [observaciones, setObservaciones] = useState<any[]>([]);
  const [estudiantes, setEstudiantes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const [obsRes, estRes] = await Promise.all([
        supabase.from("observaciones").select("*").order("fecha", { ascending: false }),
        supabase.from("estudiantes").select("id, nombre_completo"),
      ]);
      setObservaciones(obsRes.data || []);
      const map: Record<string, string> = {};
      (estRes.data || []).forEach(e => { map[e.id] = e.nombre_completo; });
      setEstudiantes(map);
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Seguimiento</h1>
        <Button size="lg" className="gap-2"><Plus className="h-4 w-4" /> Nueva observación</Button>
      </div>

      {observaciones.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-3">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No hay observaciones registradas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {observaciones.map(obs => {
            const config = tipoLabel[obs.tipo] || { label: obs.tipo, variant: "secondary" as const };
            return (
              <Card key={obs.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-semibold">{estudiantes[obs.estudiante_id] || "Estudiante"}</p>
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </div>
                  <p className="text-sm">{obs.descripcion}</p>
                  <p className="text-xs text-muted-foreground mt-2">{obs.fecha}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
