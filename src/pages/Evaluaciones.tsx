import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Loader2, ClipboardCheck, Sparkles, FileText, ListChecks, Shuffle, ChevronRight, ChevronLeft, Trash2, GripVertical, CheckCircle2, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useInstitucion } from "@/hooks/useInstitucion";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";

const tipoLabel: Record<string, string> = {
  prueba_escrita: "Prueba escrita", oral: "Oral", trabajo_practico: "Trabajo práctico",
  laboratorio: "Laboratorio", tarea: "Tarea", evaluacion_formativa: "Formativa",
};

const tipoColor: Record<string, string> = {
  prueba_escrita: "bg-primary/10 text-primary", oral: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  trabajo_practico: "bg-accent/10 text-accent-foreground", laboratorio: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  tarea: "bg-muted text-muted-foreground", evaluacion_formativa: "bg-secondary text-secondary-foreground",
};

type Modalidad = "manual" | "preguntas" | "multiple_opcion" | "mixta";
type Pregunta = { tipo_pregunta: string; enunciado: string; opciones?: { texto: string; correcta: boolean }[]; puntos: number };

interface MainData {
  grupos: any[];
  clases: any[];
  materias: Record<string, string>;
  evaluaciones: any[];
  contenidos: Record<string, any[]>;
}

const EMPTY_MAIN: MainData = { grupos: [], clases: [], materias: {}, evaluaciones: [], contenidos: {} };

export default function Evaluaciones() {
  const { user } = useAuth();
  const { institucionActiva } = useInstitucion();
  const queryClient = useQueryClient();

  const instId = institucionActiva?.id ?? "";

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedGrupoId, setSelectedGrupoId] = useState("");
  const [selectedClaseId, setSelectedClaseId] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [modalidad, setModalidad] = useState<Modalidad>("manual");
  const [cantidad, setCantidad] = useState(10);
  const [dificultad, setDificultad] = useState("intermedio");
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<string>("prueba_escrita");
  const [fecha, setFecha] = useState(new Date().toISOString().split("T")[0]);
  const [peso, setPeso] = useState<string>("");
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [generating, setGenerating] = useState(false);

  // Detail sheet
  const [detailEval, setDetailEval] = useState<any | null>(null);
  const [detailContenido, setDetailContenido] = useState<any[]>([]);
  const [detailNotas, setDetailNotas] = useState<any[]>([]);
  const [detailEstudiantes, setDetailEstudiantes] = useState<any[]>([]);
  const [deletingEvalId, setDeletingEvalId] = useState<string | null>(null);

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: mainData = EMPTY_MAIN, isLoading } = useQuery<MainData>({
    queryKey: qk.evaluaciones(instId),
    enabled: !!user && !!instId,
    queryFn: async () => {
      const { data: grpData, error: grpError } = await supabase
        .from("grupos").select("id, nombre").eq("institucion_id", instId);
      if (grpError) throw grpError;
      const gruposList = grpData || [];
      const grupoIds = gruposList.map(g => g.id);
      if (grupoIds.length === 0) return { ...EMPTY_MAIN, grupos: gruposList };

      const [clsRes, matRes, evRes] = await Promise.all([
        supabase.from("clases").select("id, materia_id, grupo_id").in("grupo_id", grupoIds),
        supabase.from("materias").select("id, nombre"),
        supabase.from("evaluaciones").select("*").order("fecha", { ascending: false }),
      ]);
      if (clsRes.error) throw clsRes.error;
      if (matRes.error) throw matRes.error;
      if (evRes.error) throw evRes.error;

      const clsData = clsRes.data || [];
      const mm: Record<string, string> = {};
      (matRes.data || []).forEach(m => { mm[m.id] = m.nombre; });

      const claseIds = new Set(clsData.map(c => c.id));
      const evFiltered = (evRes.data || []).filter(e => claseIds.has(e.clase_id));

      let contenidosMap: Record<string, any[]> = {};
      if (evFiltered.length > 0) {
        const { data: contData, error: contError } = await supabase
          .from("evaluacion_contenido").select("*")
          .in("evaluacion_id", evFiltered.map(e => e.id)).order("orden");
        if (contError) throw contError;
        (contData || []).forEach(c => {
          if (!contenidosMap[c.evaluacion_id]) contenidosMap[c.evaluacion_id] = [];
          contenidosMap[c.evaluacion_id].push(c);
        });
      }

      return { grupos: gruposList, clases: clsData, materias: mm, evaluaciones: evFiltered, contenidos: contenidosMap };
    },
  });

  const { grupos, clases, materias, evaluaciones, contenidos } = mainData;

  // Period context — only when wizard step 1 is fully filled
  const periodEnabled = !!selectedClaseId && !!fechaDesde && !!fechaHasta;
  const { data: periodData } = useQuery({
    queryKey: qk.periodContext(selectedClaseId, fechaDesde, fechaHasta),
    enabled: periodEnabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const [planRes, diarioRes] = await Promise.all([
        supabase.from("planificacion_clases").select("*").eq("clase_id", selectedClaseId)
          .gte("fecha", fechaDesde).lte("fecha", fechaHasta)
          .in("estado", ["completado", "parcial"]).order("fecha"),
        supabase.from("diario_clase").select("*").eq("clase_id", selectedClaseId)
          .gte("fecha", fechaDesde).lte("fecha", fechaHasta).order("fecha"),
      ]);
      if (planRes.error) console.error("periodContext plan:", planRes.error);
      if (diarioRes.error) console.error("periodContext diario:", diarioRes.error);
      return { temasPeriodo: planRes.data || [], diarioPeriodo: diarioRes.data || [] };
    },
  });

  const temasPeriodo = periodData?.temasPeriodo ?? [];
  const diarioPeriodo = periodData?.diarioPeriodo ?? [];

  // ── Mutations ─────────────────────────────────────────────────────────────

  const invalidate = () => queryClient.invalidateQueries({ queryKey: qk.evaluaciones(instId) });

  const createMutation = useMutation({
    mutationFn: async ({ evalPayload, preguntasToSave }: { evalPayload: object; preguntasToSave: Pregunta[] }) => {
      const { data: ev, error: evErr } = await supabase
        .from("evaluaciones").insert(evalPayload).select().single();
      if (evErr) throw evErr;

      if (preguntasToSave.length > 0) {
        const rows = preguntasToSave.map((p, i) => ({
          evaluacion_id: ev.id, orden: i, tipo_pregunta: p.tipo_pregunta,
          enunciado: p.enunciado, opciones: p.opciones || null, puntos: p.puntos,
          user_id: user!.id,
        }));
        const { error: cErr } = await supabase.from("evaluacion_contenido").insert(rows);
        if (cErr) throw cErr;
      }
    },
    onSuccess: () => {
      toast.success("Evaluación creada exitosamente");
      setWizardOpen(false);
      resetWizard();
      invalidate();
    },
    onError: (e: any) => {
      toast.error(e.message || "Error al guardar");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (evalId: string) => {
      const { error: contDelError } = await supabase.from("evaluacion_contenido").delete().eq("evaluacion_id", evalId);
      if (contDelError) throw contDelError;
      const { error: notasDelError } = await supabase.from("notas").delete().eq("evaluacion_id", evalId);
      if (notasDelError) throw notasDelError;
      const { error } = await supabase.from("evaluaciones").delete().eq("id", evalId);
      if (error) throw error;
    },
    onSuccess: () => {
      setDetailEval(null);
      setDeletingEvalId(null);
      toast.success("Evaluación eliminada");
      invalidate();
    },
    onError: (e: any) => {
      toast.error(e.message || "Error al eliminar");
    },
  });

  // ── Helpers ───────────────────────────────────────────────────────────────

  const clasesDelGrupo = useMemo(() => clases.filter(c => c.grupo_id === selectedGrupoId), [clases, selectedGrupoId]);

  const getClaseLabel = (claseId: string) => {
    const c = clases.find(cl => cl.id === claseId);
    if (!c) return "Clase desconocida";
    const grp = grupos.find(g => g.id === c.grupo_id);
    return `${materias[c.materia_id] || "?"} - ${grp?.nombre || "?"}`;
  };

  const resetWizard = () => {
    setStep(1); setSelectedGrupoId(""); setSelectedClaseId("");
    setFechaDesde(""); setFechaHasta(""); setModalidad("manual");
    setCantidad(10); setDificultad("intermedio"); setNombre("");
    setTipo("prueba_escrita"); setFecha(new Date().toISOString().split("T")[0]);
    setPeso(""); setPreguntas([]); setGenerating(false);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-evaluation", {
        body: { temas: temasPeriodo, diarioEntries: diarioPeriodo, modalidad, cantidad, dificultad },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPreguntas(data.questions || []);
      toast.success(`${data.questions?.length || 0} preguntas generadas`);
    } catch (e: any) {
      toast.error(e.message || "Error generando preguntas");
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = () => {
    if (!nombre.trim()) { toast.error("Ingresá un nombre para la evaluación"); return; }
    if (!selectedClaseId) { toast.error("Seleccioná una clase"); return; }
    createMutation.mutate({
      evalPayload: {
        nombre, tipo: tipo as any, fecha: fecha || null,
        peso: peso ? Number(peso) : null, clase_id: selectedClaseId, user_id: user!.id,
      },
      preguntasToSave: preguntas,
    });
  };

  const openDetail = async (ev: any) => {
    setDetailEval(ev);
    setDetailContenido(contenidos[ev.id] || []);
    const cls = clases.find(c => c.id === ev.clase_id);
    if (cls) {
      const [notasRes, estRes] = await Promise.all([
        supabase.from("notas").select("*").eq("evaluacion_id", ev.id),
        supabase.from("estudiantes").select("id, nombre_completo, apellido, numero_lista").eq("grupo_id", cls.grupo_id).order("numero_lista"),
      ]);
      if (notasRes.error) console.error("openDetail notas:", notasRes.error);
      if (estRes.error) console.error("openDetail estudiantes:", estRes.error);
      setDetailNotas(notasRes.data || []);
      setDetailEstudiantes(estRes.data || []);
    }
  };

  const removeQuestion = (idx: number) => setPreguntas(prev => prev.filter((_, i) => i !== idx));
  const updateQuestion = (idx: number, field: string, value: any) => {
    setPreguntas(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const printEvaluacion = (evalNombre: string, evalFecha: string, claseId: string, questions: { tipo_pregunta: string; enunciado: string; opciones?: any[]; puntos: number }[]) => {
    const cls = clases.find(c => c.id === claseId);
    const materiaName = cls ? (materias[cls.materia_id] || "") : "";
    const grupoName = cls ? (grupos.find(g => g.id === cls.grupo_id)?.nombre || "") : "";
    const fechaFormatted = evalFecha || new Date().toISOString().split("T")[0];

    const questionsHtml = questions.map((q, i) => {
      let body = "";
      if (q.opciones && q.opciones.length > 0) {
        body = q.opciones.map((o: any, oi: number) =>
          `<div style="margin:4px 0 4px 16px;font-size:14px;">${String.fromCharCode(65 + oi)}) ${o.texto}</div>`
        ).join("");
      } else {
        body = Array(3).fill('<div style="border-bottom:1px solid #ccc;height:28px;margin:4px 0;"></div>').join("");
      }
      return `
        <div style="margin-bottom:16px;">
          <div style="display:flex;justify-content:space-between;align-items:baseline;">
            <strong style="font-size:14px;">${i + 1}. ${q.enunciado}</strong>
            <span style="font-size:12px;color:#666;white-space:nowrap;margin-left:8px;">(${q.puntos} pts)</span>
          </div>
          ${body}
        </div>
      `;
    }).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${evalNombre}</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;margin:32px;color:#222;}
        .header{border-bottom:2px solid #222;padding-bottom:12px;margin-bottom:20px;}
        .header h1{margin:0 0 4px 0;font-size:20px;}
        .meta{display:flex;gap:24px;font-size:13px;color:#555;margin-bottom:8px;}
        .name-line{margin-top:12px;font-size:14px;}
        .name-line span{display:inline-block;border-bottom:1px solid #222;width:300px;margin-left:8px;}
        @media print{body{margin:20mm;}}
      </style></head><body>
        <div class="header">
          <h1>${evalNombre}</h1>
          <div class="meta">
            <span>Materia: ${materiaName}</span>
            <span>Grupo: ${grupoName}</span>
            <span>Fecha: ${fechaFormatted}</span>
          </div>
          <div class="name-line">Nombre y Apellido:<span></span></div>
        </div>
        ${questionsHtml}
      </body></html>`;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.left = "-9999px";
    iframe.style.width = "0";
    iframe.style.height = "0";
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      iframe.contentWindow?.focus();
      setTimeout(() => {
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      }, 300);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const canAdvanceStep1 = selectedGrupoId && selectedClaseId && fechaDesde && fechaHasta;
  const canAdvanceStep2 = modalidad === "manual" || preguntas.length > 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Evaluaciones</h1>
        <Button size="lg" className="gap-2" onClick={() => { resetWizard(); setWizardOpen(true); }}>
          <Plus className="h-4 w-4" /> Nueva evaluación
        </Button>
      </div>

      {evaluaciones.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-3">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No hay evaluaciones creadas aún.</p>
            <Button variant="outline" onClick={() => { resetWizard(); setWizardOpen(true); }}>
              Crear primera evaluación
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {evaluaciones.map(ev => {
            const qCount = contenidos[ev.id]?.length || 0;
            return (
              <Card key={ev.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openDetail(ev)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold">{ev.nombre}</p>
                    <p className="text-sm text-muted-foreground">
                      {getClaseLabel(ev.clase_id)} · {ev.fecha || "Sin fecha"}
                      {qCount > 0 && <span className="ml-2">· {qCount} preguntas</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {ev.peso && <span className="text-xs text-muted-foreground">Peso: {ev.peso}%</span>}
                    <Badge className={tipoColor[ev.tipo] || ""} variant="secondary">
                      {tipoLabel[ev.tipo] || ev.tipo}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* === WIZARD DIALOG === */}
      <Dialog open={wizardOpen} onOpenChange={(o) => { if (!o) resetWizard(); setWizardOpen(o); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {step === 1 && "Paso 1: Seleccionar clase y periodo"}
              {step === 2 && "Paso 2: Modalidad de generación"}
              {step === 3 && "Paso 3: Revisar y crear"}
            </DialogTitle>
            <DialogDescription>
              {step === 1 && "Elegí el grupo, la materia y el rango de fechas del periodo a evaluar."}
              {step === 2 && "Elegí cómo querés generar el contenido de la evaluación."}
              {step === 3 && "Revisá las preguntas, completá los datos y creá la evaluación."}
            </DialogDescription>
          </DialogHeader>

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Grupo</Label>
                  <Select value={selectedGrupoId} onValueChange={(v) => { setSelectedGrupoId(v); setSelectedClaseId(""); }}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar grupo" /></SelectTrigger>
                    <SelectContent>
                      {grupos.map(g => <SelectItem key={g.id} value={g.id}>{g.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Clase (materia)</Label>
                  <Select value={selectedClaseId} onValueChange={setSelectedClaseId} disabled={!selectedGrupoId}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar clase" /></SelectTrigger>
                    <SelectContent>
                      {clasesDelGrupo.map(c => (
                        <SelectItem key={c.id} value={c.id}>{materias[c.materia_id] || "Sin nombre"}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Desde</Label>
                  <Input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Hasta</Label>
                  <Input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} />
                </div>
              </div>

              {selectedClaseId && fechaDesde && fechaHasta && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4 space-y-2">
                    <p className="text-sm font-medium">Contexto del periodo</p>
                    <div className="flex gap-4 text-sm">
                      <span className="text-muted-foreground">{temasPeriodo.length} temas cubiertos</span>
                      <span className="text-muted-foreground">{diarioPeriodo.length} clases dictadas</span>
                    </div>
                    {temasPeriodo.length > 0 && (
                      <div className="text-xs text-muted-foreground space-y-0.5 max-h-32 overflow-y-auto">
                        {temasPeriodo.map((t, i) => (
                          <p key={i}>• {t.unidad_titulo}: {t.tema_titulo}</p>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end">
                <Button onClick={() => setStep(2)} disabled={!canAdvanceStep1} className="gap-1">
                  Siguiente <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {([
                  { id: "manual" as Modalidad, icon: FileText, title: "Manual", desc: "Creás las preguntas vos mismo" },
                  { id: "preguntas" as Modalidad, icon: Sparkles, title: "Auto-preguntas", desc: "IA genera preguntas abiertas" },
                  { id: "multiple_opcion" as Modalidad, icon: ListChecks, title: "Múltiple opción", desc: "IA genera opciones con distractores" },
                  { id: "mixta" as Modalidad, icon: Shuffle, title: "Mixta", desc: "IA combina abiertas + opción múltiple" },
                ]).map(m => (
                  <Card
                    key={m.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${modalidad === m.id ? "ring-2 ring-primary border-primary" : ""}`}
                    onClick={() => setModalidad(m.id)}
                  >
                    <CardContent className="p-4 text-center space-y-2">
                      <m.icon className={`h-8 w-8 mx-auto ${modalidad === m.id ? "text-primary" : "text-muted-foreground"}`} />
                      <p className="font-medium text-sm">{m.title}</p>
                      <p className="text-xs text-muted-foreground">{m.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {modalidad !== "manual" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cantidad de preguntas</Label>
                    <Select value={String(cantidad)} onValueChange={v => setCantidad(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[5, 10, 15, 20].map(n => <SelectItem key={n} value={String(n)}>{n} preguntas</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Dificultad</Label>
                    <Select value={dificultad} onValueChange={setDificultad}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basico">Básico</SelectItem>
                        <SelectItem value="intermedio">Intermedio</SelectItem>
                        <SelectItem value="avanzado">Avanzado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {modalidad !== "manual" && (
                <Button onClick={handleGenerate} disabled={generating} className="w-full gap-2">
                  {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generando con IA...</> : <><Sparkles className="h-4 w-4" /> Generar preguntas</>}
                </Button>
              )}

              {preguntas.length > 0 && (
                <p className="text-sm text-muted-foreground text-center">
                  <CheckCircle2 className="h-4 w-4 inline mr-1 text-primary" />
                  {preguntas.length} preguntas generadas. Avanzá al siguiente paso para revisarlas.
                </p>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)} className="gap-1">
                  <ChevronLeft className="h-4 w-4" /> Anterior
                </Button>
                <Button onClick={() => setStep(3)} disabled={modalidad !== "manual" && !canAdvanceStep2} className="gap-1">
                  Siguiente <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre de la evaluación *</Label>
                  <Input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Parcial Unidad 1-3" />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={tipo} onValueChange={setTipo}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(tipoLabel).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Peso (%)</Label>
                  <Input type="number" value={peso} onChange={e => setPeso(e.target.value)} placeholder="Ej: 20" min={0} max={100} />
                </div>
              </div>

              {preguntas.length > 0 && (
                <div className="space-y-2">
                  <Label>Preguntas ({preguntas.length})</Label>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {preguntas.map((p, i) => (
                      <Card key={i} className="relative">
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-start gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {p.tipo_pregunta === "multiple_opcion" ? "Opción múltiple" : "Abierta"}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{p.puntos} pts</span>
                              </div>
                              <Textarea
                                value={p.enunciado}
                                onChange={e => updateQuestion(i, "enunciado", e.target.value)}
                                className="text-sm min-h-[40px] resize-none"
                                rows={2}
                              />
                              {p.opciones && p.opciones.length > 0 && (
                                <div className="pl-2 space-y-1">
                                  {p.opciones.map((o, oi) => (
                                    <div key={oi} className={`text-xs flex items-center gap-1 ${o.correcta ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                                      <span>{String.fromCharCode(65 + oi)})</span>
                                      <span>{o.texto}</span>
                                      {o.correcta && <CheckCircle2 className="h-3 w-3" />}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7" onClick={() => removeQuestion(i)}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)} className="gap-1">
                  <ChevronLeft className="h-4 w-4" /> Anterior
                </Button>
                <div className="flex gap-2">
                  {preguntas.length > 0 && (
                    <Button variant="outline" className="gap-2" onClick={() => printEvaluacion(nombre || "Evaluación", fecha, selectedClaseId, preguntas)}>
                      <Printer className="h-4 w-4" /> Imprimir
                    </Button>
                  )}
                  <Button onClick={handleSave} disabled={createMutation.isPending || !nombre.trim()} className="gap-2">
                    {createMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</> : <><Plus className="h-4 w-4" /> Crear evaluación</>}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* === DETAIL SHEET === */}
      <Sheet open={!!detailEval} onOpenChange={(o) => { if (!o) setDetailEval(null); }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {detailEval && (
            <>
              <SheetHeader>
                <div className="flex items-center justify-between">
                   <SheetTitle>{detailEval.nombre}</SheetTitle>
                   <div className="flex gap-1.5">
                     {detailContenido.length > 0 && (
                       <Button variant="outline" size="sm" className="gap-1.5" onClick={() => printEvaluacion(
                         detailEval.nombre, detailEval.fecha, detailEval.clase_id,
                         detailContenido.map((c: any) => ({ tipo_pregunta: c.tipo_pregunta, enunciado: c.enunciado, opciones: c.opciones as any[], puntos: c.puntos }))
                       )}>
                         <Printer className="h-3.5 w-3.5" /> Imprimir
                       </Button>
                     )}
                     <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => setDeletingEvalId(detailEval.id)}>
                       <Trash2 className="h-3.5 w-3.5" /> Eliminar
                     </Button>
                   </div>
                 </div>
                <SheetDescription>
                  {getClaseLabel(detailEval.clase_id)} · {detailEval.fecha || "Sin fecha"}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-4 space-y-2">
                <div className="flex gap-2">
                  <Badge className={tipoColor[detailEval.tipo] || ""} variant="secondary">
                    {tipoLabel[detailEval.tipo] || detailEval.tipo}
                  </Badge>
                  {detailEval.peso && <Badge variant="outline">Peso: {detailEval.peso}%</Badge>}
                </div>
              </div>

              <Tabs defaultValue={detailContenido.length > 0 ? "preguntas" : "notas"} className="mt-6">
                <TabsList className="w-full">
                  {detailContenido.length > 0 && <TabsTrigger value="preguntas" className="flex-1">Preguntas ({detailContenido.length})</TabsTrigger>}
                  <TabsTrigger value="notas" className="flex-1">Notas</TabsTrigger>
                </TabsList>

                {detailContenido.length > 0 && (
                  <TabsContent value="preguntas" className="space-y-2 mt-4">
                    {detailContenido.map((c, i) => (
                      <Card key={c.id}>
                        <CardContent className="p-3 space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-bold text-muted-foreground">{i + 1}.</span>
                            <Badge variant="outline" className="text-xs">
                              {c.tipo_pregunta === "multiple_opcion" ? "Opción múltiple" : "Abierta"}
                            </Badge>
                            <span className="text-muted-foreground">{c.puntos} pts</span>
                          </div>
                          <p className="text-sm">{c.enunciado}</p>
                          {c.opciones && Array.isArray(c.opciones) && (
                            <div className="pl-3 space-y-0.5">
                              {(c.opciones as any[]).map((o: any, oi: number) => (
                                <p key={oi} className={`text-xs ${o.correcta ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                                  {String.fromCharCode(65 + oi)}) {o.texto} {o.correcta && "✓"}
                                </p>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>
                )}

                <TabsContent value="notas" className="mt-4">
                  {detailEstudiantes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No hay estudiantes en este grupo.</p>
                  ) : (
                    <div className="space-y-1">
                      {detailEstudiantes.map(est => {
                        const nota = detailNotas.find(n => n.estudiante_id === est.id);
                        return (
                          <div key={est.id} className="flex items-center justify-between py-2 border-b last:border-0">
                            <span className="text-sm">{est.numero_lista ? `${est.numero_lista}. ` : ""}{est.nombre_completo} {est.apellido || ""}</span>
                            <span className={`text-sm font-medium ${nota?.nota != null ? (nota.nota >= 6 ? "text-primary" : "text-destructive") : "text-muted-foreground"}`}>
                              {nota?.nota != null ? nota.nota : "—"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* === DELETE CONFIRMATION === */}
      <AlertDialog open={!!deletingEvalId} onOpenChange={(o) => { if (!o) setDeletingEvalId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar evaluación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la evaluación, sus preguntas y todas las notas asociadas. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={() => deletingEvalId && deleteMutation.mutate(deletingEvalId)}
            >
              {deleteMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Eliminando...</> : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
