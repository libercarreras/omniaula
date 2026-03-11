import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStudentMetrics } from "@/hooks/useStudentMetrics";
import { toast } from "sonner";

interface Props {
  studentId: string;
  claseId: string;
  claseLabel: string;
  estudiantes: any[];
}

export function BulletinCommentGenerator({ studentId, claseId, claseLabel, estudiantes }: Props) {
  const [comment, setComment] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { fetchMetrics } = useStudentMetrics();
  const student = estudiantes.find(e => e.id === studentId);

  const generateComment = async () => {
    if (!student) return;
    setIsGenerating(true);
    setComment("");
    try {
      const metrics = await fetchMetrics(studentId, claseId);
      const response = await supabase.functions.invoke("generate-bulletin-comment", {
        body: {
          studentName: student.nombre_completo,
          claseLabel,
          asistencia: metrics.asistencia,
          promedio: metrics.promedio,
          participacion: metrics.participacion,
          observaciones: metrics.observaciones,
          tareasEntregadas: metrics.tareasEntregadas,
          tareasTotal: metrics.tareasTotal,
        },
      });
      if (response.error) throw new Error(response.error.message);
      setComment(response.data?.comment || "");
    } catch {
      setComment(`${student.nombre_completo} es un estudiante de ${claseLabel}. Se requieren más datos para generar un comentario completo.`);
      toast.info("Comentario generado localmente");
    } finally { setIsGenerating(false); }
  };

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Generador de comentarios con IA</p>
              <p className="text-xs text-muted-foreground mt-1">Genera un comentario para el boletín basado en datos reales del estudiante.</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Button className="w-full gap-2" size="lg" onClick={generateComment} disabled={isGenerating}>
        {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin" /> Recopilando datos y generando...</> : <><Sparkles className="h-4 w-4" /> Generar comentario</>}
      </Button>
      {comment && (
        <div className="space-y-3">
          <Textarea value={comment} onChange={e => setComment(e.target.value)} className="min-h-[120px] text-sm" />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { navigator.clipboard.writeText(comment); toast.success("Copiado"); }}><Copy className="h-4 w-4" /> Copiar</Button>
          </div>
        </div>
      )}
    </div>
  );
}
