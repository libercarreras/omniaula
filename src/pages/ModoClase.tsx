import { useParams, useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  ArrowLeft, UserCheck, ClipboardCheck, MessageSquare,
  Check, X, Clock, LogOut, CheckCheck, Star,
  ThumbsUp, AlertCircle, BookX, Brain, History, Loader2, BookOpen, Save, CheckCircle2,
  FileText, Upload, Trash2, Settings2,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { EstructuraPrograma } from "@/components/programa/EstructuraPrograma";
import { PlanificacionTimeline } from "@/components/programa/PlanificacionTimeline";
import { cn } from "@/lib/utils";
import { StudentDetailSheet } from "@/components/clase/StudentDetailSheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDebounceCallback } from "@/hooks/useDebounce";

type ModoActivo = "asistencia" | "notas" | "observaciones" | "participacion" | "diario" | "programa";
type EstadoAsistencia = "presente" | "falta" | "tarde" | "retiro" | null;
type NivelParticipacion = "alta" | "media" | "baja";

const tagObservaciones = [
  { id: "participacion", label: "Buen desempeño", icon: ThumbsUp, color: "bg-success/10 text-success border-success/30", tipo: "participacion" as const },
  { id: "actitud", label: "Necesita apoyo", icon: AlertCircle, color: "bg-warning/10 text-warning border-warning/30", tipo: "actitud" as const },
  { id: "cumplimiento_tareas", label: "No entrega tareas", icon: BookX, color: "bg-destructive/10 text-destructive border-destructive/30", tipo: "cumplimiento_tareas" as const },
  { id: "dificultad_contenidos", label: "Dificultad", icon: Brain, color: "bg-primary/10 text-primary border-primary/30", tipo: "dificultad_contenidos" as const },
];

export default function ModoClase() {
  const { claseId } = useParams<{ claseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [clase, setClase] = useState<any>(null);
  const [materia, setMateria] = useState<any>(null);
  const [grupo, setGrupo] = useState<any>(null);
  const [estudiantesClase, setEstudiantesClase] = useState<any[]>([]);
  const [evaluacionesClase, setEvaluacionesClase] = useState<any[]>([]);

  const [modoActivo, setModoActivo] = useState<ModoActivo>("asistencia");
  const [asistencia, setAsistencia] = useState<Record<string, EstadoAsistencia>>({});
  const [participacion, setParticipacion] = useState<Record<string, NivelParticipacion | null>>({});
  const [notasState, setNotasState] = useState<Record<string, string>>({});
  const [obsState, setObsState] = useState<Record<string, string[]>>({});
  const [evaluacionActiva, setEvaluacionActiva] = useState<string | null>(null);
  const [studentDetailId, setStudentDetailId] = useState<string | null>(null);

  // Diario state
  const [diarioTema, setDiarioTema] = useState("");
  const [diarioActividad, setDiarioActividad] = useState("");
  const [diarioObs, setDiarioObs] = useState("");
  const [diarioId, setDiarioId] = useState<string | null>(null);
  const [diarioSugerencias, setDiarioSugerencias] = useState<string[]>([]);

  // Programa anual state
  const [programaContenido, setProgramaContenido] = useState("");
  const [programaId, setProgramaId] = useState<string | null>(null);
  const [programaArchivoUrl, setProgramaArchivoUrl] = useState<string | null>(null);
  const [programaArchivoNombre, setProgramaArchivoNombre] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [programaEstructura, setProgramaEstructura] = useState<any>(null);
  const [savingEstructura, setSavingEstructura] = useState(false);
  const [editClaseOpen, setEditClaseOpen] = useState(false);
  const [editHorario, setEditHorario] = useState("");
  const [editAula, setEditAula] = useState("");
  const [savingClase, setSavingClase] = useState(false);

  const hoyISO = new Date().toISOString().split("T")[0];
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (!user || !claseId) return;
    const fetchAll = async () => {
      setLoading(true);
      const { data: claseData } = await supabase.from("clases").select("*").eq("id", claseId).maybeSingle();
      if (!claseData) { setLoading(false); return; }
      setClase(claseData);

      const [matRes, grpRes, estRes, evRes, asistRes, diarioRes] = await Promise.all([
        supabase.from("materias").select("*").eq("id", claseData.materia_id).maybeSingle(),
        supabase.from("grupos").select("*").eq("id", claseData.grupo_id).maybeSingle(),
        supabase.from("estudiantes").select("*").eq("grupo_id", claseData.grupo_id).order("nombre_completo"),
        supabase.from("evaluaciones").select("*").eq("clase_id", claseId),
        supabase.from("asistencia").select("*").eq("clase_id", claseId).eq("fecha", hoyISO),
        supabase.from("diario_clase").select("*").eq("clase_id", claseId).eq("fecha", hoyISO).maybeSingle(),
      ]);
      setMateria(matRes.data);
      setGrupo(grpRes.data);
      setEstudiantesClase(estRes.data || []);
      setEvaluacionesClase(evRes.data || []);

      const asistMap: Record<string, EstadoAsistencia> = {};
      (asistRes.data || []).forEach(a => { asistMap[a.estudiante_id] = a.estado as EstadoAsistencia; });
      setAsistencia(asistMap);

      if (diarioRes.data) {
        setDiarioId(diarioRes.data.id);
        setDiarioTema(diarioRes.data.tema_trabajado || "");
        setDiarioActividad(diarioRes.data.actividad_realizada || "");
        setDiarioObs(diarioRes.data.observaciones || "");
      }

      // Load diary suggestions (last 5 topics from this class)
      const { data: prevDiarios } = await supabase.from("diario_clase")
        .select("tema_trabajado").eq("clase_id", claseId)
        .not("tema_trabajado", "is", null)
        .neq("fecha", hoyISO)
        .order("fecha", { ascending: false }).limit(5);
      const temas = (prevDiarios || []).map(d => d.tema_trabajado).filter(Boolean) as string[];
      setDiarioSugerencias([...new Set(temas)]);

      const evIds = (evRes.data || []).map(e => e.id);
      if (evIds.length > 0) {
        const { data: notasData } = await supabase.from("notas").select("*").in("evaluacion_id", evIds);
        const nMap: Record<string, string> = {};
        (notasData || []).forEach(n => { if (n.nota !== null) nMap[`${n.evaluacion_id}-${n.estudiante_id}`] = String(n.nota); });
        setNotasState(nMap);
      }

      const { data: obsData } = await supabase.from("observaciones").select("*").eq("clase_id", claseId).eq("fecha", hoyISO);
      const oMap: Record<string, string[]> = {};
      (obsData || []).forEach(o => {
        if (!oMap[o.estudiante_id]) oMap[o.estudiante_id] = [];
        oMap[o.estudiante_id].push(o.tipo);
      });
      setObsState(oMap);

      // Load programa anual
      const { data: progData } = await supabase.from("programas_anuales")
        .select("*").eq("clase_id", claseId).maybeSingle();
      if (progData) {
        setProgramaId(progData.id);
        setProgramaContenido(progData.contenido || "");
        setProgramaArchivoUrl(progData.archivo_url || null);
        setProgramaArchivoNombre(progData.archivo_nombre || null);
        setProgramaEstructura((progData as any).contenido_estructurado || null);
      }

      // Auto-detect: if no attendance for today, switch to attendance tab
      if ((asistRes.data || []).length === 0) {
        setModoActivo("asistencia");
      }

      setLoading(false);
      // Allow auto-save after initial load
      setTimeout(() => { isInitialLoad.current = false; }, 500);
    };
    fetchAll();
  }, [user, claseId]);

  const hoy = new Date().toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });

  // ========== Auto-save callbacks ==========
  const saveAsistenciaFn = useCallback(async () => {
    if (!user || !claseId) return;
    for (const [estudiante_id, estado] of Object.entries(asistencia)) {
      if (estado) {
        const { data: existing } = await supabase.from("asistencia")
          .select("id").eq("clase_id", claseId).eq("estudiante_id", estudiante_id).eq("fecha", hoyISO).maybeSingle();
        if (existing) {
          await supabase.from("asistencia").update({ estado }).eq("id", existing.id);
        } else {
          await supabase.from("asistencia").insert({ clase_id: claseId, estudiante_id, estado, fecha: hoyISO, user_id: user.id });
        }
      } else {
        await supabase.from("asistencia").delete().eq("clase_id", claseId).eq("estudiante_id", estudiante_id).eq("fecha", hoyISO);
      }
    }
  }, [asistencia, claseId, user, hoyISO]);

  const saveNotasFn = useCallback(async () => {
    if (!user || !claseId) return;
    const entries = Object.entries(notasState).filter(([, v]) => v.trim() !== "");
    for (const [key, val] of entries) {
      const [evaluacion_id, estudiante_id] = key.split("-");
      const nota = parseFloat(val);
      if (isNaN(nota)) continue;
      const { data: existing } = await supabase.from("notas").select("id").eq("evaluacion_id", evaluacion_id).eq("estudiante_id", estudiante_id).maybeSingle();
      if (existing) {
        await supabase.from("notas").update({ nota }).eq("id", existing.id);
      } else {
        await supabase.from("notas").insert({ evaluacion_id, estudiante_id, nota, user_id: user.id });
      }
    }
  }, [notasState, user, claseId]);

  const saveObservacionesFn = useCallback(async () => {
    if (!user || !claseId) return;
    await supabase.from("observaciones").delete().eq("clase_id", claseId).eq("fecha", hoyISO);
    const records: any[] = [];
    Object.entries(obsState).forEach(([estudiante_id, tipos]) => {
      tipos.forEach(tipo => {
        records.push({
          clase_id: claseId, estudiante_id, tipo: tipo as any,
          descripcion: tagObservaciones.find(t => t.tipo === tipo)?.label || tipo,
          fecha: hoyISO, user_id: user.id,
        });
      });
    });
    if (records.length > 0) await supabase.from("observaciones").insert(records);
  }, [obsState, claseId, user, hoyISO]);

  const saveDiarioFn = useCallback(async () => {
    if (!user || !claseId) return;
    let currentDiarioId = diarioId;
    if (diarioId) {
      await supabase.from("diario_clase").update({
        tema_trabajado: diarioTema || null,
        actividad_realizada: diarioActividad || null,
        observaciones: diarioObs || null,
      }).eq("id", diarioId);
    } else {
      const { data } = await supabase.from("diario_clase").insert({
        clase_id: claseId,
        tema_trabajado: diarioTema || null,
        actividad_realizada: diarioActividad || null,
        observaciones: diarioObs || null,
        user_id: user.id, fecha: hoyISO,
      }).select("id").maybeSingle();
      if (data) { setDiarioId(data.id); currentDiarioId = data.id; }
    }

    // Auto-update planificacion: if there's a topic planned for today, mark as completed
    if (diarioTema && diarioTema.trim()) {
      const { data: todayPlan } = await supabase
        .from("planificacion_clases")
        .select("id, estado")
        .eq("clase_id", claseId)
        .eq("fecha", hoyISO)
        .eq("estado", "pendiente" as any);
      if (todayPlan && todayPlan.length > 0) {
        await supabase.from("planificacion_clases")
          .update({ estado: "completado" as any, diario_id: currentDiarioId })
          .eq("id", todayPlan[0].id);
      }
    }
  }, [diarioTema, diarioActividad, diarioObs, diarioId, claseId, user, hoyISO]);

  const saveProgramaFn = useCallback(async () => {
    if (!user || !claseId) return;
    if (programaId) {
      await supabase.from("programas_anuales").update({
        contenido: programaContenido || null,
        archivo_url: programaArchivoUrl,
        archivo_nombre: programaArchivoNombre,
      }).eq("id", programaId);
    } else {
      const { data } = await supabase.from("programas_anuales").insert({
        clase_id: claseId, user_id: user.id,
        contenido: programaContenido || null,
        archivo_url: programaArchivoUrl,
        archivo_nombre: programaArchivoNombre,
      }).select("id").maybeSingle();
      if (data) setProgramaId(data.id);
    }
  }, [programaContenido, programaArchivoUrl, programaArchivoNombre, programaId, claseId, user]);

  const asistDebounce = useDebounceCallback(saveAsistenciaFn, 2000);
  const notasDebounce = useDebounceCallback(saveNotasFn, 2500);
  const obsDebounce = useDebounceCallback(saveObservacionesFn, 2000);
  const diarioDebounce = useDebounceCallback(saveDiarioFn, 3000);
  const programaDebounce = useDebounceCallback(saveProgramaFn, 3000);

  // Get current active save status
  const currentStatus = modoActivo === "asistencia" ? asistDebounce.status
    : modoActivo === "notas" ? notasDebounce.status
    : modoActivo === "observaciones" ? obsDebounce.status
    : modoActivo === "diario" ? diarioDebounce.status
    : modoActivo === "programa" ? programaDebounce.status : "idle";

  const asistenciaStats = useMemo(() => {
    const total = estudiantesClase.length;
    const presentes = Object.values(asistencia).filter(v => v === "presente").length;
    const faltas = Object.values(asistencia).filter(v => v === "falta").length;
    const tardes = Object.values(asistencia).filter(v => v === "tarde").length;
    return { total, presentes, faltas, tardes };
  }, [asistencia, estudiantesClase.length]);

  const notasStats = useMemo(() => {
    if (!evaluacionActiva) return null;
    const vals = Object.entries(notasState)
      .filter(([k, v]) => k.startsWith(evaluacionActiva) && v.trim() !== "")
      .map(([, v]) => parseFloat(v))
      .filter(n => !isNaN(n));
    if (vals.length === 0) return null;
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return { count: vals.length, avg: avg.toFixed(1) };
  }, [notasState, evaluacionActiva]);

  const obsStats = useMemo(() => {
    return Object.values(obsState).reduce((acc, arr) => acc + arr.length, 0);
  }, [obsState]);

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (!clase || !grupo || !materia) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">Clase no encontrada</p>
        <Button variant="outline" onClick={() => navigate("/")}>Volver al panel</Button>
      </div>
    );
  }

  const marcarAsistencia = (estId: string, estado: EstadoAsistencia) => {
    setAsistencia(prev => {
      const next = { ...prev, [estId]: prev[estId] === estado ? null : estado };
      return next;
    });
    if (!isInitialLoad.current) asistDebounce.trigger();
  };

  const marcarTodosPresentes = () => {
    const nueva: Record<string, EstadoAsistencia> = {};
    estudiantesClase.forEach(e => { nueva[e.id] = "presente"; });
    setAsistencia(nueva);
    if (!isInitialLoad.current) asistDebounce.trigger();
    toast.success("✓ Todos presentes");
  };

  const marcarParticipacion = (estId: string, nivel: NivelParticipacion) => {
    setParticipacion(prev => ({ ...prev, [estId]: prev[estId] === nivel ? null : nivel }));
  };

  const toggleObservacion = (estId: string, obsId: string) => {
    setObsState(prev => {
      const current = prev[estId] || [];
      const next = current.includes(obsId) ? current.filter(id => id !== obsId) : [...current, obsId];
      return { ...prev, [estId]: next };
    });
    if (!isInitialLoad.current) obsDebounce.trigger();
  };

  const handleNotaChange = (key: string, value: string) => {
    setNotasState(prev => ({ ...prev, [key]: value }));
    if (!isInitialLoad.current) notasDebounce.trigger();
  };

  const handleDiarioChange = (field: "tema" | "actividad" | "obs", value: string) => {
    if (field === "tema") setDiarioTema(value);
    else if (field === "actividad") setDiarioActividad(value);
    else setDiarioObs(value);
    if (!isInitialLoad.current) diarioDebounce.trigger();
  };

  const handleProgramaChange = (value: string) => {
    setProgramaContenido(value);
    if (!isInitialLoad.current) programaDebounce.trigger();
  };

  const handleProgramaFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !claseId) return;
    setUploadingFile(true);
    const path = `${user.id}/${claseId}/${file.name}`;
    const { error } = await supabase.storage.from("programas").upload(path, file, { upsert: true });
    if (error) {
      toast.error("Error al subir archivo");
      setUploadingFile(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("programas").getPublicUrl(path);
    setProgramaArchivoUrl(path);
    setProgramaArchivoNombre(file.name);
    setUploadingFile(false);
    programaDebounce.trigger();
    toast.success("Archivo subido correctamente");
  };

  const handleRemoveFile = async () => {
    if (!programaArchivoUrl) return;
    await supabase.storage.from("programas").remove([programaArchivoUrl]);
    setProgramaArchivoUrl(null);
    setProgramaArchivoNombre(null);
    programaDebounce.trigger();
    toast.success("Archivo eliminado");
  };

  const modos = [
    { id: "asistencia" as const, label: "Asist.", icon: UserCheck },
    { id: "notas" as const, label: "Notas", icon: ClipboardCheck },
    { id: "observaciones" as const, label: "Obs.", icon: MessageSquare },
    { id: "participacion" as const, label: "Partic.", icon: Star },
    { id: "diario" as const, label: "Diario", icon: BookOpen },
    { id: "programa" as const, label: "Progr.", icon: FileText },
  ];

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : name.substring(0, 2);
  };

  const StatusIndicator = () => {
    if (currentStatus === "idle") return null;
    return (
      <div className={cn(
        "flex items-center gap-1.5 text-xs font-medium transition-all animate-in fade-in",
        currentStatus === "saved" ? "text-success" : "text-muted-foreground"
      )}>
        {currentStatus === "pending" && <><span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" /> Cambios pendientes</>}
        {currentStatus === "saving" && <><Loader2 className="h-3 w-3 animate-spin" /> Guardando...</>}
        {currentStatus === "saved" && <><CheckCircle2 className="h-3 w-3" /> Guardado ✓</>}
      </div>
    );
  };

  const openEditClase = () => {
    setEditHorario(clase?.horario || "");
    setEditAula(clase?.aula || "");
    setEditClaseOpen(true);
  };

  const saveClaseDetails = async () => {
    if (!claseId) return;
    setSavingClase(true);
    const { error } = await supabase.from("clases").update({
      horario: editHorario.trim() || null,
      aula: editAula.trim() || null,
    }).eq("id", claseId);
    setSavingClase(false);
    if (error) { toast.error("Error al guardar"); return; }
    setClase((prev: any) => ({ ...prev, horario: editHorario.trim() || null, aula: editAula.trim() || null }));
    setEditClaseOpen(false);
    toast.success("Clase actualizada");
  };

  return (
    <div className="max-w-4xl mx-auto pb-6">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b -mx-4 px-4 pt-1 pb-2 md:-mx-0 md:px-0">
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0 h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-display font-bold truncate">{materia.nombre} — {grupo.nombre}</h1>
            <button onClick={openEditClase} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
              <Settings2 className="h-3 w-3" />
              {clase.horario || "Sin horario"}{clase.aula ? ` · ${clase.aula}` : ""}
            </button>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <StatusIndicator />
            <span className="text-[10px] text-muted-foreground capitalize">{hoy}</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{estudiantesClase.length}</Badge>
          </div>
        </div>
        <div className="grid grid-cols-6 gap-1">
          {modos.map(modo => (
            <button key={modo.id} className={cn("flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all", modoActivo === modo.id ? "bg-primary text-primary-foreground shadow-md" : "bg-muted/50 text-muted-foreground hover:bg-muted")} onClick={() => setModoActivo(modo.id)}>
              <modo.icon className="h-3.5 w-3.5" />{modo.label}
            </button>
          ))}
        </div>
      </div>

      {/* Context bar per mode */}
      {modoActivo === "asistencia" && (
        <div className="flex items-center justify-between py-2 gap-2">
          <Button size="sm" className="gap-1.5 bg-success hover:bg-success/90 text-success-foreground h-10 text-sm font-semibold" onClick={marcarTodosPresentes}>
            <CheckCheck className="h-4 w-4" />Todos presentes
          </Button>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="text-success font-semibold">{asistenciaStats.presentes}P</span>
            <span className="text-destructive font-semibold">{asistenciaStats.faltas}F</span>
            <span className="text-warning font-semibold">{asistenciaStats.tardes}T</span>
          </div>
        </div>
      )}

      {modoActivo === "notas" && (
        <div className="py-2 space-y-2">
          {evaluacionesClase.length > 0 ? (
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {evaluacionesClase.map(ev => (
                <button key={ev.id} className={cn("shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all", evaluacionActiva === ev.id ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground")} onClick={() => setEvaluacionActiva(ev.id)}>{ev.nombre}</button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-1">Sin evaluaciones creadas para esta clase.</p>
          )}
          {notasStats && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{notasStats.count} calificadas</span>
              <span className="font-semibold text-primary">Promedio: {notasStats.avg}</span>
            </div>
          )}
        </div>
      )}

      {modoActivo === "observaciones" && (
        <div className="flex items-center justify-between py-2">
          <span className="text-xs text-muted-foreground">{obsStats} observaciones registradas hoy</span>
        </div>
      )}

      {/* Diario tab */}
      {modoActivo === "diario" && (
        <div className="space-y-4 py-3">
          {diarioSugerencias.length > 0 && (
            <div className="space-y-1">
              <p className="text-[11px] text-muted-foreground font-medium">Temas anteriores:</p>
              <div className="flex flex-wrap gap-1.5">
                {diarioSugerencias.map((tema, i) => (
                  <button key={i} onClick={() => handleDiarioChange("tema", tema)}
                    className="px-2.5 py-1.5 rounded-lg bg-muted/60 text-xs text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors border border-transparent hover:border-primary/20">
                    {tema}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label>Tema trabajado</Label>
            <Input placeholder="Ej: Fracciones equivalentes" value={diarioTema} onChange={e => handleDiarioChange("tema", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Actividades realizadas</Label>
            <Textarea placeholder="Describe las actividades de la clase..." value={diarioActividad} onChange={e => handleDiarioChange("actividad", e.target.value)} rows={3} />
          </div>
          <div className="space-y-2">
            <Label>Observaciones generales</Label>
            <Textarea placeholder="Observaciones de la clase..." value={diarioObs} onChange={e => handleDiarioChange("obs", e.target.value)} rows={3} />
          </div>
        </div>
      )}

      {/* Programa anual tab */}
      {modoActivo === "programa" && (
        <div className="space-y-4 py-3">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Contenido del programa anual</Label>
            <Textarea
              placeholder="Pegá aquí el contenido del programa anual de la asignatura: unidades temáticas, objetivos, contenidos, bibliografía..."
              value={programaContenido}
              onChange={e => handleProgramaChange(e.target.value)}
              rows={8}
              className="text-sm leading-relaxed"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold">Archivo adjunto</Label>
            {programaArchivoNombre ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/40 border">
                <FileText className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm font-medium truncate flex-1">{programaArchivoNombre}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={handleRemoveFile}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label className="flex items-center gap-2 p-4 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 cursor-pointer transition-colors">
                {uploadingFile ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <Upload className="h-5 w-5 text-muted-foreground" />
                )}
                <span className="text-sm text-muted-foreground">
                  {uploadingFile ? "Subiendo..." : "Subir archivo (PDF, DOC, imagen)"}
                </span>
                <input type="file" className="hidden" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt" onChange={handleProgramaFileUpload} disabled={uploadingFile} />
              </label>
            )}
          </div>

          {/* AI Structure Analysis */}
          {programaContenido && (
            <div className="space-y-2 pt-2 border-t">
              <Label className="text-sm font-semibold">Estructura del programa</Label>
              <EstructuraPrograma
                contenido={programaContenido}
                estructuraGuardada={programaEstructura}
                saving={savingEstructura}
                onSave={async (est) => {
                  setSavingEstructura(true);
                  try {
                    if (programaId) {
                      await supabase.from("programas_anuales").update({
                        contenido_estructurado: est as any,
                      }).eq("id", programaId);
                    } else {
                      const { data } = await supabase.from("programas_anuales").insert({
                        clase_id: claseId!, user_id: user!.id,
                        contenido: programaContenido || null,
                        contenido_estructurado: est as any,
                      }).select("id").maybeSingle();
                      if (data) setProgramaId(data.id);
                    }
                    setProgramaEstructura(est);
                  } catch {
                    toast.error("Error al guardar la estructura");
                  } finally {
                    setSavingEstructura(false);
                  }
                }}
              />
            </div>
          )}

          {/* Planificación Timeline */}
          {programaEstructura && (
            <div className="space-y-2 pt-2 border-t">
              <Label className="text-sm font-semibold">Planificación anual</Label>
              <PlanificacionTimeline
                claseId={claseId!}
                userId={user!.id}
                horario={clase?.horario || null}
                estructura={programaEstructura}
              />
            </div>
          )}

          {!programaContenido && !programaArchivoNombre && (
            <div className="text-center py-6 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Aún no hay programa cargado para esta clase.</p>
              <p className="text-xs mt-1">Pegá el texto del programa o subí un archivo.</p>
            </div>
          )}
        </div>
      )}

      {/* Student list for non-diario/programa modes */}
      {modoActivo !== "diario" && modoActivo !== "programa" && (
        <div className="space-y-1.5 mt-1">
          {estudiantesClase.map((est, idx) => {
            const estado = asistencia[est.id];
            const estadoBg = estado === "presente" ? "border-l-success" : estado === "falta" ? "border-l-destructive" : estado === "tarde" ? "border-l-warning" : estado === "retiro" ? "border-l-muted-foreground" : "border-l-transparent";

            return (
              <div key={est.id} className={cn("bg-card rounded-lg border border-l-4 p-3 transition-all", estadoBg)}>
                <div className="flex items-center gap-2.5">
                  <button className="flex items-center gap-2.5 min-w-0 flex-1 text-left" onClick={() => setStudentDetailId(est.id)}>
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{getInitials(est.nombre_completo)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate leading-tight">{est.nombre_completo}</p>
                      <p className="text-[10px] text-muted-foreground">#{idx + 1}</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {modoActivo === "asistencia" && (
                      <>
                        {([
                          { v: "presente", icon: Check, active: "bg-success text-success-foreground" },
                          { v: "falta", icon: X, active: "bg-destructive text-destructive-foreground" },
                          { v: "tarde", icon: Clock, active: "bg-warning text-warning-foreground" },
                          { v: "retiro", icon: LogOut, active: "bg-muted-foreground text-background" },
                        ] as const).map(btn => (
                          <button key={btn.v} className={cn("h-11 w-11 rounded-xl flex items-center justify-center transition-all active:scale-95", estado === btn.v ? `${btn.active} animate-in zoom-in-95 duration-150` : "bg-muted/50 text-muted-foreground hover:bg-muted")} onClick={() => marcarAsistencia(est.id, btn.v)}>
                            <btn.icon className="h-5 w-5" />
                          </button>
                        ))}
                      </>
                    )}
                    {modoActivo === "participacion" && (
                      <>
                        {([
                          { v: "alta" as const, label: "A", color: "bg-success text-success-foreground" },
                          { v: "media" as const, label: "M", color: "bg-warning text-warning-foreground" },
                          { v: "baja" as const, label: "B", color: "bg-destructive text-destructive-foreground" },
                        ]).map(opt => (
                          <button key={opt.v} className={cn("h-11 w-11 rounded-xl flex items-center justify-center text-sm font-bold transition-all active:scale-95", participacion[est.id] === opt.v ? opt.color : "bg-muted/50 text-muted-foreground hover:bg-muted")} onClick={() => marcarParticipacion(est.id, opt.v)}>{opt.label}</button>
                        ))}
                      </>
                    )}
                    {modoActivo === "notas" && evaluacionActiva && (
                      <Input type="number" inputMode="decimal" placeholder="—" className="w-16 h-11 text-center text-lg font-bold rounded-xl border-2 focus:border-primary" value={notasState[`${evaluacionActiva}-${est.id}`] || ""} onChange={e => handleNotaChange(`${evaluacionActiva}-${est.id}`, e.target.value)} />
                    )}
                    {modoActivo === "observaciones" && (
                      <button className="h-9 w-9 rounded-lg flex items-center justify-center bg-muted/50 text-muted-foreground" onClick={() => setStudentDetailId(est.id)}><History className="h-4 w-4" /></button>
                    )}
                  </div>
                </div>
                {modoActivo === "observaciones" && (
                  <div className="flex flex-wrap gap-1.5 mt-2 ml-[46px]">
                    {tagObservaciones.map(tag => {
                      const isActive = (obsState[est.id] || []).includes(tag.tipo);
                      return (
                        <button key={tag.id} onClick={() => toggleObservacion(est.id, tag.tipo)} className={cn("inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-medium border transition-all active:scale-95", isActive ? `${tag.color} animate-in zoom-in-95 duration-150` : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/60")}>
                          <tag.icon className="h-3.5 w-3.5" />{tag.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <StudentDetailSheet studentId={studentDetailId} claseId={claseId || ""} open={!!studentDetailId} onClose={() => setStudentDetailId(null)} />

      <Dialog open={editClaseOpen} onOpenChange={setEditClaseOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar clase</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-horario">Horario</Label>
              <Input id="edit-horario" placeholder="Ej: Lunes 8:00-9:30" value={editHorario} onChange={e => setEditHorario(e.target.value)} />
              <p className="text-[11px] text-muted-foreground">Formato sugerido: Día HH:MM-HH:MM</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-aula">Aula</Label>
              <Input id="edit-aula" placeholder="Ej: Aula 12" value={editAula} onChange={e => setEditAula(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditClaseOpen(false)}>Cancelar</Button>
            <Button onClick={saveClaseDetails} disabled={savingClase}>
              {savingClase ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
