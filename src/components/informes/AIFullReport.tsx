import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Copy, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStudentMetrics } from "@/hooks/useStudentMetrics";
import { toast } from "sonner";

interface Props {
  studentId: string;
  claseId: string;
  claseLabel: string;
  estudiantes: any[];
}

export function AIFullReport({ studentId, claseId, claseLabel, estudiantes }: Props) {
  const [report, setReport] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { fetchMetrics } = useStudentMetrics();
  const student = estudiantes.find(e => e.id === studentId);

  const generateReport = async () => {
    if (!student) return;
    setIsGenerating(true);
    setReport("");
    try {
      const metrics = await fetchMetrics(studentId, claseId);
      const response = await supabase.functions.invoke("generate-student-report", {
        body: {
          studentName: student.nombre_completo,
          claseLabel,
          asistencia: metrics.asistencia,
          promedio: metrics.promedio,
          participacion: metrics.participacion,
          observaciones: metrics.observaciones,
          tareasEntregadas: metrics.tareasEntregadas,
          tareasTotal: metrics.tareasTotal,
          evaluaciones: metrics.evaluaciones,
        },
      });
      if (response.error) throw new Error(response.error.message);
      setReport(response.data?.report || "");
      toast.success("Informe generado con IA");
    } catch {
      setReport(`Informe de ${student.nombre_completo} — ${claseLabel}\n\nSe requieren más datos para generar un informe completo.`);
      toast.info("Informe generado localmente");
    } finally { setIsGenerating(false); }
  };

  return (
    <div className="space-y-4">
      <Card className="border-accent/20 bg-accent/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Informe completo con IA</p>
              <p className="text-xs text-muted-foreground mt-1">Genera un informe narrativo basado en datos reales de asistencia, notas, desempeño y observaciones.</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Button className="w-full gap-2" size="lg" onClick={generateReport} disabled={isGenerating}>
        {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin" /> Recopilando datos y generando...</> : <><Sparkles className="h-4 w-4" /> Generar informe completo</>}
      </Button>
      {report && (
        <div className="space-y-3">
          <Textarea value={report} onChange={e => setReport(e.target.value)} className="min-h-[250px] text-sm" />
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { navigator.clipboard.writeText(report); toast.success("Copiado"); }}><Copy className="h-4 w-4" /> Copiar</Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.print()}><Printer className="h-4 w-4" /> Imprimir</Button>
          </div>
        </div>
      )}
    </div>
  );
}
