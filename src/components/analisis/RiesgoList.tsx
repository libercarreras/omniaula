import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface EstudianteRiesgo {
  id: string;
  nombre: string;
  motivos: string[];
  recomendacion: string;
}

interface Props {
  claseId: string;
  grupoId: string;
}

const NIVEL_MAP: Record<string, number> = { "B": 0, "M": 1, "A": 2, "A+": 3 };

export function RiesgoList({ claseId, grupoId }: Props) {
  const [riesgo, setRiesgo] = useState<EstudianteRiesgo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!claseId || !grupoId) return;
    const analyze = async () => {
      setLoading(true);
      const { data: estudiantes } = await supabase.from("estudiantes").select("id, nombre_completo").eq("grupo_id", grupoId);
      if (!estudiantes || estudiantes.length === 0) { setRiesgo([]); setLoading(false); return; }

      const [asistRes, evalRes, desempRes] = await Promise.all([
        supabase.from("asistencia").select("estudiante_id, estado").eq("clase_id", claseId),
        supabase.from("evaluaciones").select("id").eq("clase_id", claseId),
        supabase.from("desempeno_diario").select("estudiante_id, tarea, participacion_oral, rendimiento_aula, conducta").eq("clase_id", claseId),
      ]);

      const evalIds = (evalRes.data || []).map(e => e.id);
      let notasData: any[] = [];
      if (evalIds.length > 0) {
        const { data } = await supabase.from("notas").select("estudiante_id, nota").in("evaluacion_id", evalIds);
        notasData = data || [];
      }

      const result: EstudianteRiesgo[] = [];
      for (const est of estudiantes) {
        const motivos: string[] = [];

        // Asistencia
        const estAsist = (asistRes.data || []).filter(a => a.estudiante_id === est.id);
        if (estAsist.length >= 3) {
          const faltas = estAsist.filter(a => a.estado === "falta").length;
          const pct = faltas / estAsist.length;
          if (pct > 0.3) motivos.push(`${Math.round(pct * 100)}% de inasistencias (${faltas}/${estAsist.length})`);
        }

        // Notas
        const estNotas = notasData.filter(n => n.estudiante_id === est.id && n.nota !== null);
        if (estNotas.length >= 2) {
          const prom = estNotas.reduce((s: number, n: any) => s + Number(n.nota), 0) / estNotas.length;
          if (prom < 6) motivos.push(`Promedio bajo: ${prom.toFixed(1)}`);
        }

        // Desempeño
        const estDesemp = (desempRes.data || []).filter(d => d.estudiante_id === est.id);
        if (estDesemp.length >= 3) {
          const avgField = (field: string) => {
            const vals = estDesemp.map(d => NIVEL_MAP[d[field as keyof typeof d] as string]).filter(v => v !== undefined);
            return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : -1;
          };
          const avgConducta = avgField("conducta");
          const avgParticipacion = avgField("participacion_oral");
          if (avgConducta >= 0 && avgConducta < 1) motivos.push("Conducta frecuentemente baja");
          if (avgParticipacion >= 0 && avgParticipacion < 1) motivos.push("Baja participación oral");
        }

        if (motivos.length > 0) {
          result.push({
            id: est.id,
            nombre: est.nombre_completo,
            motivos,
            recomendacion: motivos.some(m => m.includes("inasistencias"))
              ? "Contactar a la familia para conocer la situación."
              : motivos.some(m => m.includes("Conducta"))
                ? "Implementar estrategias de acompañamiento conductual."
                : "Reforzar contenidos y ofrecer acompañamiento personalizado.",
          });
        }
      }
      setRiesgo(result);
      setLoading(false);
    };
    analyze();
  }, [claseId, grupoId]);

  if (loading) return <div className="flex justify-center py-8"><AlertTriangle className="h-6 w-6 animate-pulse text-muted-foreground" /></div>;

  if (riesgo.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">No se detectaron estudiantes en riesgo o no hay datos suficientes aún.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Estudiantes que requieren atención ({riesgo.length})
        </CardTitle>
        <p className="text-sm text-muted-foreground">Basado en asistencia, notas y desempeño diario</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {riesgo.map(est => (
          <div key={est.id} className="p-3 rounded-lg bg-background border border-destructive/20">
            <p className="font-semibold text-sm mb-2">{est.nombre}</p>
            <ul className="space-y-0.5 mb-2">
              {est.motivos.map((m, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-1">
                  <span className="text-destructive mt-0.5">•</span> {m}
                </li>
              ))}
            </ul>
            <div className="bg-primary/5 p-2 rounded text-xs">
              <span className="font-medium text-primary">Sugerencia:</span> {est.recomendacion}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
