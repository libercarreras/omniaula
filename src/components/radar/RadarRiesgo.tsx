import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useInstitucion } from "@/hooks/useInstitucion";

interface EstudianteRiesgo {
  id: string;
  nombre: string;
  motivos: string[];
  recomendacion: string;
}

export function RadarRiesgo() {
  const { user } = useAuth();
  const { institucionActiva } = useInstitucion();
  const [estudiantesRiesgo, setEstudiantesRiesgo] = useState<EstudianteRiesgo[]>([]);

  useEffect(() => {
    if (!user || !institucionActiva) return;
    const analyze = async () => {
      try {
      // Get grupos for institution
      const { data: grupos, error: grpError } = await supabase.from("grupos").select("id").eq("institucion_id", institucionActiva.id);
      if (grpError) throw grpError;
      const grupoIds = (grupos || []).map(g => g.id);
      if (grupoIds.length === 0) return;

      // Get estudiantes
      const { data: estudiantes, error: estError } = await supabase.from("estudiantes").select("id, nombre_completo, grupo_id").in("grupo_id", grupoIds);
      if (estError) throw estError;
      if (!estudiantes || estudiantes.length === 0) return;

      // Get clases
      const { data: clases, error: clsError } = await supabase.from("clases").select("id").in("grupo_id", grupoIds);
      if (clsError) throw clsError;
      const claseIds = (clases || []).map(c => c.id);
      if (claseIds.length === 0) return;

      // Get asistencia (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data: asistencia, error: asistError } = await supabase.from("asistencia").select("estudiante_id, estado").in("clase_id", claseIds).gte("fecha", thirtyDaysAgo.toISOString().split("T")[0]);
      if (asistError) throw asistError;

      // Get notas
      const { data: evaluaciones, error: evalError } = await supabase.from("evaluaciones").select("id").in("clase_id", claseIds);
      if (evalError) throw evalError;
      const evIds = (evaluaciones || []).map(e => e.id);
      let notasData: any[] = [];
      if (evIds.length > 0) {
        const { data, error: notasError } = await supabase.from("notas").select("estudiante_id, nota").in("evaluacion_id", evIds);
        if (notasError) throw notasError;
        notasData = data || [];
      }

      // Analyze per student
      const riesgo: EstudianteRiesgo[] = [];
      for (const est of estudiantes) {
        const motivos: string[] = [];
        const estAsist = (asistencia || []).filter(a => a.estudiante_id === est.id);
        if (estAsist.length >= 3) {
          const faltas = estAsist.filter(a => a.estado === "falta").length;
          const pctFaltas = faltas / estAsist.length;
          if (pctFaltas > 0.3) motivos.push(`${Math.round(pctFaltas * 100)}% de inasistencias (${faltas}/${estAsist.length})`);
        }

        const estNotas = notasData.filter(n => n.estudiante_id === est.id && n.nota !== null);
        if (estNotas.length >= 2) {
          const promedio = estNotas.reduce((s: number, n: any) => s + Number(n.nota), 0) / estNotas.length;
          if (promedio < 6) motivos.push(`Promedio bajo: ${promedio.toFixed(1)}`);
        }

        if (motivos.length > 0) {
          riesgo.push({
            id: est.id,
            nombre: est.nombre_completo,
            motivos,
            recomendacion: motivos.some(m => m.includes("inasistencias"))
              ? "Contactar a la familia para conocer la situación."
              : "Reforzar contenidos y ofrecer acompañamiento personalizado.",
          });
        }
      }
      setEstudiantesRiesgo(riesgo);
      } catch (e: any) {
        console.error("RadarRiesgo analyze:", e);
      }
    };
    analyze();
  }, [user, institucionActiva]);

  if (estudiantesRiesgo.length === 0) return null;

  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Estudiantes que requieren atención ({estudiantesRiesgo.length})
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Detectados automáticamente según asistencia y notas
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {estudiantesRiesgo.map((est) => (
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
