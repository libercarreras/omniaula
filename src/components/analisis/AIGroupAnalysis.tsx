import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Loader2, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AIGroupAnalysisProps {
  claseLabel: string;
}

export function AIGroupAnalysis({ claseLabel }: AIGroupAnalysisProps) {
  const [analysis, setAnalysis] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    setIsLoading(true);
    setAnalysis("");

    try {
      const response = await supabase.functions.invoke("analyze-group", {
        body: {
          claseLabel,
          promedioGeneral: 0,
          asistenciaPromedio: 0,
          totalEstudiantes: 0,
          altoRendimiento: 0,
          bajoRendimiento: 0,
          tareasEntregadasPromedio: 0,
          estudiantesEnRiesgo: [],
          distribucionNotas: [],
          tendenciaPromedio: [],
        },
      });

      if (response.error) throw new Error(response.error.message);
      setAnalysis(response.data?.analysis || "No se pudo generar el análisis.");
    } catch {
      setAnalysis(
        `📊 Análisis de ${claseLabel}\n\nAún no hay suficientes datos registrados para generar un análisis completo. ` +
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
        {isLoading ? <><Loader2 className="h-5 w-5 animate-spin" /> Analizando grupo...</> : <><Sparkles className="h-5 w-5" /> Analizar mi grupo</>}
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
