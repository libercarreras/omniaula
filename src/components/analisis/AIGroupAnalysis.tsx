import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Loader2, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AIGroupAnalysisProps {
  claseId: string;
  claseLabel: string;
  grupoId?: string;
}

export function AIGroupAnalysis({ claseId, claseLabel, grupoId }: AIGroupAnalysisProps) {
  const [analysis, setAnalysis] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setAnalysis("");

    try {
      // Fetch real data
      const { data: estudiantes } = await supabase.from("estudiantes").select("id, nombre_completo").eq("grupo_id", grupoId || "");
      const estIds = (estudiantes || []).map(e => e.id);
      const totalEstudiantes = estIds.length;

      const [asistRes, evalRes, desempRes] = await Promise.all([
        supabase.from("asistencia").select("estudiante_id, estado").eq("clase_id", claseId),
        supabase.from("evaluaciones").select("id, nombre").eq("clase_id", claseId),
        supabase.from("desempeno_diario").select("estudiante_id, tarea, participacion_oral, rendimiento_aula, conducta").eq("clase_id", claseId),
      ]);

      const asistData = asistRes.data || [];
      const totalAsist = asistData.length;
      const presentes = asistData.filter(a => a.estado === "presente" || a.estado === "tarde").length;
      const asistenciaPromedio = totalAsist > 0 ? Math.round((presentes / totalAsist) * 100) : 0;

      const evalIds = (evalRes.data || []).map(e => e.id);
      let notasData: any[] = [];
      if (evalIds.length > 0) {
        const { data } = await supabase.from("notas").select("estudiante_id, nota").in("evaluacion_id", evalIds);
        notasData = (data || []).filter(n => n.nota !== null);
      }

      const allNotas = notasData.map(n => Number(n.nota));
      const promedioGeneral = allNotas.length > 0 ? Math.round((allNotas.reduce((a, b) => a + b, 0) / allNotas.length) * 10) / 10 : 0;

      // Per-student averages
      let altoRendimiento = 0;
      let bajoRendimiento = 0;
      const estudiantesEnRiesgo: string[] = [];

      for (const est of (estudiantes || [])) {
        const estNotas = notasData.filter(n => n.estudiante_id === est.id);
        if (estNotas.length > 0) {
          const prom = estNotas.reduce((s: number, n: any) => s + Number(n.nota), 0) / estNotas.length;
          if (prom >= 8) altoRendimiento++;
          if (prom < 6) { bajoRendimiento++; estudiantesEnRiesgo.push(`${est.nombre_completo} (prom: ${prom.toFixed(1)})`); }
        }
      }

      const response = await supabase.functions.invoke("analyze-group", {
        body: {
          claseLabel,
          promedioGeneral,
          asistenciaPromedio,
          totalEstudiantes,
          altoRendimiento,
          bajoRendimiento,
          tareasEntregadasPromedio: 0,
          estudiantesEnRiesgo,
          distribucionNotas: [
            { rango: "0-3", cantidad: allNotas.filter(n => n <= 3).length },
            { rango: "4-5", cantidad: allNotas.filter(n => n >= 4 && n <= 5).length },
            { rango: "6-7", cantidad: allNotas.filter(n => n >= 6 && n <= 7).length },
            { rango: "8-9", cantidad: allNotas.filter(n => n >= 8 && n <= 9).length },
            { rango: "10", cantidad: allNotas.filter(n => n >= 10).length },
          ],
          tendenciaPromedio: [],
        },
      });

      if (response.error) throw new Error(response.error.message);
      setAnalysis(response.data?.analysis || "No se pudo generar el análisis.");
    } catch {
      setAnalysis(
        `📊 Análisis de ${claseLabel}\n\nAún no hay suficientes datos registrados para generar un análisis completo con IA. ` +
        `Registra asistencia, evaluaciones y observaciones para obtener un análisis detallado del grupo.`
      );
      toast.info("Análisis generado localmente");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button onClick={handleAnalyze} disabled={isLoading} size="lg" className="w-full gap-2 h-12 text-base font-semibold">
        {isLoading ? <><Loader2 className="h-5 w-5 animate-spin" /> Recopilando datos y analizando...</> : <><Sparkles className="h-5 w-5" /> Analizar mi grupo</>}
      </Button>

      {analysis && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="text-sm font-semibold text-primary">Análisis inteligente</p>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleAnalyze}><RotateCcw className="h-3.5 w-3.5" /></Button>
            </div>
            <div className="text-sm leading-relaxed whitespace-pre-line">{analysis}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
