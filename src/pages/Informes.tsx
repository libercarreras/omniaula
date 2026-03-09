import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText, Download, Users, User, Sparkles, Loader2,
  Printer, ClipboardCheck, UserCheck, MessageSquare, BookOpen, Copy,
} from "lucide-react";
import { clases, estudiantes, getClaseLabel, getClase } from "@/data/mockData";
import { mockEstudianteReporte, mockGrupoReporte } from "@/data/mockAnalytics";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function Informes() {
  const [claseSeleccionada, setClaseSeleccionada] = useState(clases[0].id);
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(estudiantes[0].id);
  const clase = getClase(claseSeleccionada);
  const estudiantesClase = estudiantes.filter((e) => e.grupoId === clase?.grupoId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-display font-bold">Informes</h1>
        <Select value={claseSeleccionada} onValueChange={(v) => {
          setClaseSeleccionada(v);
          const c = getClase(v);
          const ests = estudiantes.filter((e) => e.grupoId === c?.grupoId);
          if (ests.length) setEstudianteSeleccionado(ests[0].id);
        }}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {clases.map((c) => (
              <SelectItem key={c.id} value={c.id}>{getClaseLabel(c.id)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="individual" className="w-full">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="individual">Individual</TabsTrigger>
          <TabsTrigger value="grupo">Grupo</TabsTrigger>
          <TabsTrigger value="boletin">Boletín IA</TabsTrigger>
          <TabsTrigger value="informe-ia">Informe IA</TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="space-y-4 mt-4">
          <Select value={estudianteSeleccionado} onValueChange={setEstudianteSeleccionado}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Seleccionar estudiante" />
            </SelectTrigger>
            <SelectContent>
              {estudiantesClase.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.apellido}, {e.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <StudentReportCard claseLabel={getClaseLabel(claseSeleccionada)} />
        </TabsContent>

        <TabsContent value="grupo" className="space-y-4 mt-4">
          <GroupReportCard claseLabel={getClaseLabel(claseSeleccionada)} />
        </TabsContent>

        <TabsContent value="boletin" className="space-y-4 mt-4">
          <Select value={estudianteSeleccionado} onValueChange={setEstudianteSeleccionado}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Seleccionar estudiante" />
            </SelectTrigger>
            <SelectContent>
              {estudiantesClase.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.apellido}, {e.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <BulletinCommentGenerator
            studentId={estudianteSeleccionado}
            claseLabel={getClaseLabel(claseSeleccionada)}
          />
        </TabsContent>

        {/* New: Informe IA tab */}
        <TabsContent value="informe-ia" className="space-y-4 mt-4">
          <Select value={estudianteSeleccionado} onValueChange={setEstudianteSeleccionado}>
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Seleccionar estudiante" />
            </SelectTrigger>
            <SelectContent>
              {estudiantesClase.map((e) => (
                <SelectItem key={e.id} value={e.id}>{e.apellido}, {e.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <AIFullReport
            studentId={estudianteSeleccionado}
            claseLabel={getClaseLabel(claseSeleccionada)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---- Student Report Card ---- */
function StudentReportCard({ claseLabel }: { claseLabel: string }) {
  const data = mockEstudianteReporte;
  const handlePrint = () => window.print();
  const handleExportCSV = () => {
    const rows = [
      ["Estudiante", data.nombre], ["Clase", claseLabel],
      ["Asistencia", `${data.asistencia}%`], ["Promedio", data.promedio.toString()],
      ["Participación", data.participacion], ["Tareas", `${data.tareasEntregadas}/${data.tareasTotal}`],
      [""], ["Evaluación", "Nota", "Fecha"],
      ...data.evaluaciones.map((e) => [e.nombre, e.nota.toString(), e.fecha]),
      [""], ["Observaciones"], ...data.observaciones.map((o) => [o]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `informe_${data.nombre.replace(/ /g, "_")}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("Informe exportado como CSV");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePrint}>
          <Printer className="h-4 w-4" /> Imprimir / PDF
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportCSV}>
          <Download className="h-4 w-4" /> Exportar CSV
        </Button>
      </div>
      <div className="space-y-4 print:space-y-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" /> Informe de {data.nombre}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{claseLabel}</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-primary/5 rounded-lg">
                <p className="text-2xl font-bold text-primary">{data.asistencia}%</p>
                <p className="text-xs text-muted-foreground">Asistencia</p>
              </div>
              <div className="text-center p-3 bg-accent/5 rounded-lg">
                <p className="text-2xl font-bold text-accent">{data.promedio}</p>
                <p className="text-xs text-muted-foreground">Promedio</p>
              </div>
              <div className="text-center p-3 bg-warning/5 rounded-lg">
                <p className="text-2xl font-bold text-warning">{data.participacion}</p>
                <p className="text-xs text-muted-foreground">Participación</p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <p className="text-2xl font-bold">{data.tareasEntregadas}/{data.tareasTotal}</p>
                <p className="text-xs text-muted-foreground">Tareas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" /> Evaluaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.evaluaciones.map((ev, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <div>
                  <p className="text-sm font-medium">{ev.nombre}</p>
                  <p className="text-xs text-muted-foreground">{ev.fecha}</p>
                </div>
                <span className="text-lg font-bold text-primary">{ev.nota}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Observaciones del docente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {data.observaciones.map((obs, i) => (
                <li key={i} className="text-sm flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">•</span> {obs}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ---- Group Report Card ---- */
function GroupReportCard({ claseLabel }: { claseLabel: string }) {
  const data = mockGrupoReporte;
  const handlePrint = () => window.print();
  const handleExportCSV = () => {
    const rows = [
      ["Clase", data.clase], ["Período", data.periodo],
      ["Total estudiantes", data.totalEstudiantes.toString()],
      ["Promedio general", data.promedioGeneral.toString()],
      ["Asistencia promedio", `${data.asistenciaPromedio}%`],
      ["Alto rendimiento", data.altoRendimiento.toString()],
      ["Bajo rendimiento", data.bajoRendimiento.toString()],
      ["Tareas entregadas promedio", `${data.tareasEntregadasPromedio}%`],
      ["Evaluaciones realizadas", data.evaluacionesRealizadas.toString()],
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `informe_grupo_${data.clase.replace(/ /g, "_")}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("Informe del grupo exportado como CSV");
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePrint}>
          <Printer className="h-4 w-4" /> Imprimir / PDF
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleExportCSV}>
          <Download className="h-4 w-4" /> Exportar CSV
        </Button>
      </div>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" /> Informe del grupo
          </CardTitle>
          <p className="text-sm text-muted-foreground">{claseLabel} — {data.periodo}</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <StatBox label="Estudiantes" value={data.totalEstudiantes} />
            <StatBox label="Promedio" value={data.promedioGeneral} color="text-primary" />
            <StatBox label="Asistencia" value={`${data.asistenciaPromedio}%`} color="text-success" />
            <StatBox label="Alto rendimiento" value={data.altoRendimiento} color="text-accent" />
            <StatBox label="Bajo rendimiento" value={data.bajoRendimiento} color="text-destructive" />
            <StatBox label="Tareas entregadas" value={`${data.tareasEntregadasPromedio}%`} />
            <StatBox label="Evaluaciones" value={data.evaluacionesRealizadas} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <BookOpen className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm mb-1">Resumen del desempeño</p>
              <p className="text-sm text-muted-foreground">
                El grupo {claseLabel} presenta un desempeño general satisfactorio con un promedio de {data.promedioGeneral}.
                La asistencia se mantiene en {data.asistenciaPromedio}%.
                Se identificaron {data.bajoRendimiento} estudiantes con bajo rendimiento que requieren atención especial.
                El {data.tareasEntregadasPromedio}% de las tareas fueron entregadas a tiempo.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="text-center p-3 bg-muted/30 rounded-lg">
      <p className={`text-2xl font-bold ${color || ""}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

/* ---- Bulletin Comment Generator ---- */
function BulletinCommentGenerator({ studentId, claseLabel }: { studentId: string; claseLabel: string }) {
  const [comment, setComment] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const student = estudiantes.find((e) => e.id === studentId);
  const data = mockEstudianteReporte;

  const generateComment = async () => {
    if (!student) return;
    setIsGenerating(true);
    setComment("");
    try {
      const response = await supabase.functions.invoke("generate-bulletin-comment", {
        body: {
          studentName: `${student.nombre} ${student.apellido}`,
          claseLabel, asistencia: data.asistencia, promedio: data.promedio,
          participacion: data.participacion, observaciones: data.observaciones,
          tareasEntregadas: data.tareasEntregadas, tareasTotal: data.tareasTotal,
        },
      });
      if (response.error) throw new Error(response.error.message);
      setComment(response.data?.comment || "No se pudo generar el comentario.");
    } catch {
      setComment(
        `${student.nombre} ${student.apellido} presenta un desempeño ${data.promedio >= 7 ? "satisfactorio" : "que requiere mejora"} en ${claseLabel}. ` +
        `Su asistencia es del ${data.asistencia}% y su participación es ${data.participacion.toLowerCase()}. ` +
        `Ha entregado ${data.tareasEntregadas} de ${data.tareasTotal} tareas asignadas. ` +
        (data.observaciones.length > 0 ? `Observaciones: ${data.observaciones.join(". ")}.` : "")
      );
      toast.info("Comentario generado localmente (IA no disponible)");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(comment);
    toast.success("Comentario copiado al portapapeles");
  };

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Generador de comentarios con IA</p>
              <p className="text-xs text-muted-foreground mt-1">
                Genera automáticamente un comentario para el boletín basado en las notas,
                asistencia, participación y observaciones del estudiante.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      {student && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium mb-2">
              Estudiante: <span className="text-primary">{student.apellido}, {student.nombre}</span>
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div className="bg-muted/50 p-2 rounded text-center"><p className="font-bold">{data.asistencia}%</p><p className="text-muted-foreground">Asistencia</p></div>
              <div className="bg-muted/50 p-2 rounded text-center"><p className="font-bold">{data.promedio}</p><p className="text-muted-foreground">Promedio</p></div>
              <div className="bg-muted/50 p-2 rounded text-center"><p className="font-bold">{data.participacion}</p><p className="text-muted-foreground">Participación</p></div>
              <div className="bg-muted/50 p-2 rounded text-center"><p className="font-bold">{data.tareasEntregadas}/{data.tareasTotal}</p><p className="text-muted-foreground">Tareas</p></div>
            </div>
          </CardContent>
        </Card>
      )}
      <Button className="w-full gap-2" size="lg" onClick={generateComment} disabled={isGenerating}>
        {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generando...</> : <><Sparkles className="h-4 w-4" /> Generar comentario para boletín</>}
      </Button>
      {comment && (
        <div className="space-y-3">
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} className="min-h-[120px] text-sm" />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopy}><FileText className="h-4 w-4" /> Copiar</Button>
            <Button size="sm" className="gap-1.5" onClick={() => toast.success("Comentario guardado")}>Guardar</Button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- AI Full Report Generator ---- */
function AIFullReport({ studentId, claseLabel }: { studentId: string; claseLabel: string }) {
  const [report, setReport] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const student = estudiantes.find((e) => e.id === studentId);
  const data = mockEstudianteReporte;

  const generateReport = async () => {
    if (!student) return;
    setIsGenerating(true);
    setReport("");
    try {
      const response = await supabase.functions.invoke("generate-student-report", {
        body: {
          studentName: `${student.nombre} ${student.apellido}`,
          claseLabel, asistencia: data.asistencia, promedio: data.promedio,
          participacion: data.participacion, observaciones: data.observaciones,
          tareasEntregadas: data.tareasEntregadas, tareasTotal: data.tareasTotal,
          evaluaciones: data.evaluaciones,
        },
      });
      if (response.error) throw new Error(response.error.message);
      setReport(response.data?.report || "");
      toast.success("Informe generado con IA");
    } catch {
      setReport(
        `Informe de ${student.nombre} ${student.apellido} — ${claseLabel}\n\n` +
        `El estudiante presenta un desempeño ${data.promedio >= 7 ? "satisfactorio" : "que requiere atención"} durante el período evaluado. ` +
        `Su asistencia es del ${data.asistencia}%, con una participación ${data.participacion.toLowerCase()} en las actividades de clase.\n\n` +
        `En cuanto al rendimiento académico, mantiene un promedio de ${data.promedio} y ha entregado ${data.tareasEntregadas} de ${data.tareasTotal} tareas asignadas. ` +
        (data.observaciones.length > 0 ? `\n\nObservaciones: ${data.observaciones.join(". ")}.` : "") +
        `\n\nSe recomienda continuar con el seguimiento del progreso académico y fomentar la participación activa en clase.`
      );
      toast.info("Informe generado localmente (IA no disponible)");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(report);
    toast.success("Informe copiado al portapapeles");
  };

  const handlePrint = () => window.print();

  return (
    <div className="space-y-4">
      <Card className="border-accent/20 bg-accent/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Informe completo con IA</p>
              <p className="text-xs text-muted-foreground mt-1">
                Genera un informe narrativo detallado del estudiante con análisis de fortalezas,
                áreas de mejora y recomendaciones. Puedes editarlo antes de exportar.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button className="w-full gap-2" size="lg" onClick={generateReport} disabled={isGenerating}>
        {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generando informe...</> : <><Sparkles className="h-4 w-4" /> Generar informe completo</>}
      </Button>

      {report && (
        <div className="space-y-3">
          <Textarea
            value={report}
            onChange={(e) => setReport(e.target.value)}
            className="min-h-[250px] text-sm"
          />
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleCopy}>
              <Copy className="h-4 w-4" /> Copiar
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePrint}>
              <Printer className="h-4 w-4" /> Imprimir / PDF
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => toast.success("Informe guardado")}>
              Guardar informe
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
