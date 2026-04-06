import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStudentMetrics } from "@/hooks/useStudentMetrics";
import { toast } from "sonner";

function truncateToWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '...';
}

interface Props {
  studentId: string;
  claseId: string;
  claseLabel: string;
  estudiantes: any[];
}

export function AIFullReport({ studentId, claseId, claseLabel, estudiantes }: Props) {
  const [reportsByStudent, setReportsByStudent] = useState<Record<string, string>>({});
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generatingProgress, setGeneratingProgress] = useState({ done: 0, total: 0 });
  const [report, setReport] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [wordCount, setWordCount] = useState(60);
  const wordCountOptions = [30, 60, 90];
  const { fetchMetrics } = useStudentMetrics();
  const student = estudiantes.find(e => e.id === studentId);

  const generateReport = async () => {
    if (!student) return;
    setIsGenerating(true);
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
          desempeno: metrics.desempeno,
          wordCount,
        },
      });
      if (response.error) throw new Error(response.error.message);
      const rawReport = response.data?.report || "";
      setReport(truncateToWords(rawReport, wordCount));
      toast.success("Informe generado con IA");
    } catch {
      const fallback = `Informe de ${student.nombre_completo} — ${claseLabel}\n\nSe requieren más datos para generar un informe completo.`;
      setReport(fallback);
      toast.info("Informe generado localmente");
    } finally { setIsGenerating(false); }
  };

  const generateSingleReport = async (s: any): Promise<{ id: string; report: string }> => {
    try {
      const metrics = await fetchMetrics(s.id, claseId);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const response = await supabase.functions.invoke("generate-student-report", {
        body: {
          studentName: s.nombre_completo,
          claseLabel,
          asistencia: metrics.asistencia,
          promedio: metrics.promedio,
          participacion: metrics.participacion,
          observaciones: metrics.observaciones,
          tareasEntregadas: metrics.tareasEntregadas,
          tareasTotal: metrics.tareasTotal,
          evaluaciones: metrics.evaluaciones,
          desempeno: metrics.desempeno,
          wordCount,
        },
      });
      clearTimeout(timeout);
      if (response.error) throw new Error(response.error.message);
      const raw = response.data?.report || "";
      return { id: s.id, report: truncateToWords(raw, wordCount) };
    } catch {
      return { id: s.id, report: `Informe de ${s.nombre_completo} — ${claseLabel}\n\nSe requieren más datos para generar un informe completo.` };
    }
  };

  const generateAllReports = async () => {
    setIsGeneratingAll(true);
    const total = estudiantes.length;
    setGeneratingProgress({ done: 0, total });
    const allReports: Record<string, string> = {};

    const BATCH_SIZE = 3;
    for (let i = 0; i < estudiantes.length; i += BATCH_SIZE) {
      const batch = estudiantes.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(batch.map(s => generateSingleReport(s)));
      for (const r of results) {
        allReports[r.id] = r.report;
      }
      setGeneratingProgress({ done: Math.min(i + BATCH_SIZE, total), total });
      setReportsByStudent({ ...allReports });
    }

    toast.success("Informes generados para todos los alumnos");
    setIsGeneratingAll(false);
  };

  return (
    <div className="space-y-4">
      <Card className="border-accent/20 bg-accent/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Informe con IA</p>
              <p className="text-xs text-muted-foreground mt-1">Genera un informe narrativo basado en datos reales de asistencia, notas, desempeño y observaciones.</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex items-center gap-2 mb-3">
        <span className="font-medium text-sm">Longitud del informe:</span>
        <Select value={String(wordCount)} onValueChange={v => setWordCount(Number(v))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">30 palabras</SelectItem>
            <SelectItem value="60">60 palabras</SelectItem>
            <SelectItem value="90">90 palabras</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        <Button className="flex-1 gap-2" size="lg" onClick={generateReport} disabled={isGenerating}>
          {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generando...</> : <><Sparkles className="h-4 w-4" /> Generar informe individual</>}
        </Button>
        <Button variant="secondary" className="gap-2" onClick={generateAllReports} disabled={isGeneratingAll || estudiantes.length === 0}>
          {isGeneratingAll ? <><Loader2 className="h-4 w-4 animate-spin" /> {generatingProgress.done}/{generatingProgress.total} generados...</> : <><Sparkles className="h-4 w-4" /> Generar todos los informes</>}
        </Button>
      </div>

      {/* Informe individual */}
      {report && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Informe de {student?.nombre_completo}</p>
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => { navigator.clipboard.writeText(report); toast.success("Copiado"); }}>
                <Copy className="h-4 w-4" /> Copiar
              </Button>
            </div>
            <Textarea value={report} onChange={e => setReport(e.target.value)} className="min-h-[200px] text-sm" />
          </CardContent>
        </Card>
      )}

      {/* Informes de todos los alumnos */}
      {Object.keys(reportsByStudent).length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Informes generados ({Object.keys(reportsByStudent).length})</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => {
              const allText = Object.entries(reportsByStudent).map(([id, text]) => `${text}\n---`).join('\n');
              navigator.clipboard.writeText(allText);
              toast.success("Todos los informes copiados");
            }}>
              Copiar todos
            </Button>
          </div>
          <div className="space-y-4">
            {estudiantes.map(est => (
              <Card key={est.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{est.nombre_completo}</p>
                    <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => {
                      navigator.clipboard.writeText(reportsByStudent[est.id]);
                      toast.success(`Informe de ${est.nombre_completo} copiado`);
                    }}>
                      <Copy className="h-4 w-4" /> Copiar
                    </Button>
                  </div>
                  <Textarea
                    value={reportsByStudent[est.id]}
                    onChange={e => setReportsByStudent(prev => ({ ...prev, [est.id]: e.target.value }))}
                    className="min-h-[150px] text-sm"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
