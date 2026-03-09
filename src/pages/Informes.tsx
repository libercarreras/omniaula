import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Sparkles, Loader2, Printer, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useInstitucion } from "@/hooks/useInstitucion";
import { toast } from "sonner";

export default function Informes() {
  const { user } = useAuth();
  const { institucionActiva } = useInstitucion();
  const [loading, setLoading] = useState(true);
  const [clases, setClases] = useState<any[]>([]);
  const [materias, setMaterias] = useState<Record<string, string>>({});
  const [grupos, setGrupos] = useState<Record<string, string>>({});
  const [estudiantes, setEstudiantes] = useState<any[]>([]);
  const [claseSeleccionada, setClaseSeleccionada] = useState("");
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState("");

  useEffect(() => {
    if (!user || !institucionActiva) return;
    const fetch = async () => {
      setLoading(true);
      const { data: grpData } = await supabase.from("grupos").select("id, nombre").eq("institucion_id", institucionActiva.id);
      const grupoIds = (grpData || []).map(g => g.id);
      const gm: Record<string, string> = {};
      (grpData || []).forEach(g => { gm[g.id] = g.nombre; });
      setGrupos(gm);

      if (grupoIds.length === 0) { setClases([]); setEstudiantes([]); setLoading(false); return; }

      const [clsRes, matRes, estRes] = await Promise.all([
        supabase.from("clases").select("*").in("grupo_id", grupoIds),
        supabase.from("materias").select("id, nombre"),
        supabase.from("estudiantes").select("id, nombre_completo, grupo_id").in("grupo_id", grupoIds),
      ]);
      setClases(clsRes.data || []);
      const mm: Record<string, string> = {};
      (matRes.data || []).forEach(m => { mm[m.id] = m.nombre; });
      setMaterias(mm);
      setEstudiantes(estRes.data || []);
      if (clsRes.data?.length) setClaseSeleccionada(clsRes.data[0].id);
      setLoading(false);
    };
    fetch();
  }, [user, institucionActiva]);

  useEffect(() => {
    if (!claseSeleccionada) return;
    const clase = clases.find(c => c.id === claseSeleccionada);
    if (!clase) return;
    const ests = estudiantes.filter(e => e.grupo_id === clase.grupo_id);
    if (ests.length) setEstudianteSeleccionado(ests[0].id);
    else setEstudianteSeleccionado("");
  }, [claseSeleccionada, clases, estudiantes]);

  const getClaseLabel = (id: string) => {
    const c = clases.find(cl => cl.id === id);
    if (!c) return "?";
    return `${materias[c.materia_id] || "?"} - ${grupos[c.grupo_id] || "?"}`;
  };

  const claseActual = clases.find(c => c.id === claseSeleccionada);
  const estudiantesClase = claseActual ? estudiantes.filter(e => e.grupo_id === claseActual.grupo_id) : [];

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (clases.length === 0) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-display font-bold">Informes</h1>
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-3">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">Crea clases y registra datos para generar informes.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-display font-bold">Informes</h1>
        <Select value={claseSeleccionada} onValueChange={setClaseSeleccionada}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            {clases.map(c => <SelectItem key={c.id} value={c.id}>{getClaseLabel(c.id)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="informe-ia" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="informe-ia">Informe IA</TabsTrigger>
          <TabsTrigger value="boletin">Boletín IA</TabsTrigger>
        </TabsList>

        <TabsContent value="informe-ia" className="space-y-4 mt-4">
          <Select value={estudianteSeleccionado} onValueChange={setEstudianteSeleccionado}>
            <SelectTrigger className="w-full md:w-64"><SelectValue placeholder="Seleccionar estudiante" /></SelectTrigger>
            <SelectContent>
              {estudiantesClase.map(e => <SelectItem key={e.id} value={e.id}>{e.nombre_completo}</SelectItem>)}
            </SelectContent>
          </Select>
          {estudianteSeleccionado ? (
            <AIFullReport studentId={estudianteSeleccionado} claseLabel={getClaseLabel(claseSeleccionada)} estudiantes={estudiantes} />
          ) : (
            <p className="text-sm text-muted-foreground">Selecciona un estudiante para generar un informe.</p>
          )}
        </TabsContent>

        <TabsContent value="boletin" className="space-y-4 mt-4">
          <Select value={estudianteSeleccionado} onValueChange={setEstudianteSeleccionado}>
            <SelectTrigger className="w-full md:w-64"><SelectValue placeholder="Seleccionar estudiante" /></SelectTrigger>
            <SelectContent>
              {estudiantesClase.map(e => <SelectItem key={e.id} value={e.id}>{e.nombre_completo}</SelectItem>)}
            </SelectContent>
          </Select>
          {estudianteSeleccionado ? (
            <BulletinCommentGenerator studentId={estudianteSeleccionado} claseLabel={getClaseLabel(claseSeleccionada)} estudiantes={estudiantes} />
          ) : (
            <p className="text-sm text-muted-foreground">Selecciona un estudiante.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BulletinCommentGenerator({ studentId, claseLabel, estudiantes }: { studentId: string; claseLabel: string; estudiantes: any[] }) {
  const [comment, setComment] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const student = estudiantes.find(e => e.id === studentId);

  const generateComment = async () => {
    if (!student) return;
    setIsGenerating(true);
    setComment("");
    try {
      const response = await supabase.functions.invoke("generate-bulletin-comment", {
        body: { studentName: student.nombre_completo, claseLabel, asistencia: 0, promedio: 0, participacion: "Media", observaciones: [], tareasEntregadas: 0, tareasTotal: 0 },
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
              <p className="text-xs text-muted-foreground mt-1">Genera un comentario para el boletín basado en los datos del estudiante.</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Button className="w-full gap-2" size="lg" onClick={generateComment} disabled={isGenerating}>
        {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generando...</> : <><Sparkles className="h-4 w-4" /> Generar comentario</>}
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

function AIFullReport({ studentId, claseLabel, estudiantes }: { studentId: string; claseLabel: string; estudiantes: any[] }) {
  const [report, setReport] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const student = estudiantes.find(e => e.id === studentId);

  const generateReport = async () => {
    if (!student) return;
    setIsGenerating(true);
    setReport("");
    try {
      const response = await supabase.functions.invoke("generate-student-report", {
        body: { studentName: student.nombre_completo, claseLabel, asistencia: 0, promedio: 0, participacion: "Media", observaciones: [], tareasEntregadas: 0, tareasTotal: 0, evaluaciones: [] },
      });
      if (response.error) throw new Error(response.error.message);
      setReport(response.data?.report || "");
      toast.success("Informe generado con IA");
    } catch {
      setReport(`Informe de ${student.nombre_completo} — ${claseLabel}\n\nSe requieren más datos (evaluaciones, asistencia, observaciones) para generar un informe completo.`);
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
              <p className="text-xs text-muted-foreground mt-1">Genera un informe narrativo detallado del estudiante.</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Button className="w-full gap-2" size="lg" onClick={generateReport} disabled={isGenerating}>
        {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generando...</> : <><Sparkles className="h-4 w-4" /> Generar informe completo</>}
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
