import { useParams, useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, FileText, Upload, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { EstructuraPrograma } from "@/components/programa/EstructuraPrograma";
import { PlanificacionTimeline } from "@/components/programa/PlanificacionTimeline";
import { cn } from "@/lib/utils";
import { StudentDetailSheet } from "@/components/clase/StudentDetailSheet";
import { ClaseHeader } from "@/components/clase/ClaseHeader";
import { ResumenTab } from "@/components/clase/tabs/ResumenTab";
import { AsistenciaTab } from "@/components/clase/tabs/AsistenciaTab";
import { NotasTab } from "@/components/clase/tabs/NotasTab";
import { ObservacionesTab } from "@/components/clase/tabs/ObservacionesTab";
import { DiarioTab } from "@/components/clase/tabs/DiarioTab";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDebounceCallback } from "@/hooks/useDebounce";
import { tagObservaciones } from "@/components/clase/types";
import type { ModoActivo, EstadoAsistencia, NivelParticipacion, TabBadges } from "@/components/clase/types";

const DIAS_SEMANA = [
  { key: "Lun", label: "Lun" }, { key: "Mar", label: "Mar" }, { key: "Mié", label: "Mié" },
  { key: "Jue", label: "Jue" }, { key: "Vie", label: "Vie" }, { key: "Sáb", label: "Sáb" },
];

const parseHorarioToState = (horario: string | null) => {
  if (!horario) return { dias: [] as string[], hora: "" };
  const diasFound: string[] = [];
  const lower = horario.toLowerCase();
  const map: Record<string, string> = { lun: "Lun", mar: "Mar", "mié": "Mié", mie: "Mié", jue: "Jue", vie: "Vie", "sáb": "Sáb", sab: "Sáb" };
  for (const [k, v] of Object.entries(map)) {
    if (lower.includes(k) && !diasFound.includes(v)) diasFound.push(v);
  }
  const horaMatch = horario.match(/(\d{1,2}[:.]\d{2}(?:\s*[-–]\s*\d{1,2}[:.]\d{2})?)/);
  return { dias: diasFound, hora: horaMatch ? horaMatch[1] : "" };
};

const buildHorarioString = (dias: string[], hora: string) => {
  if (dias.length === 0) return null;
  const ordered = DIAS_SEMANA.filter(d => dias.includes(d.key)).map(d => d.key);
  return `${ordered.join("/")}${hora ? " " + hora : ""}`;
};

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

  // Date selector
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const todayISO = new Date().toISOString().split("T")[0];
  const selectedDateISO = selectedDate.toISOString().split("T")[0];
  const daysDiff = Math.floor((Date.now() - selectedDate.getTime()) / 86400000);
  const isReadonly = daysDiff > 7;
  const isPastDate = selectedDateISO !== todayISO;

  const [modoActivo, setModoActivo] = useState<ModoActivo>("resumen");
  const [asistencia, setAsistencia] = useState<Record<string, EstadoAsistencia>>({});
  const [participacion, setParticipacion] = useState<Record<string, NivelParticipacion | null>>({});
  const [notasState, setNotasState] = useState<Record<string, string>>({});
  const [obsState, setObsState] = useState<Record<string, string[]>>({});
  const [evaluacionActiva, setEvaluacionActiva] = useState<string | null>(null);
  const [studentDetailId, setStudentDetailId] = useState<string | null>(null);
  const [showProgramaDialog, setShowProgramaDialog] = useState(false);

  // Diario state
  const [diarioTema, setDiarioTema] = useState("");
  const [diarioActividad, setDiarioActividad] = useState("");
  const [diarioObs, setDiarioObs] = useState("");
  const [diarioId, setDiarioId] = useState<string | null>(null);
  const [diarioSugerencias, setDiarioSugerencias] = useState<string[]>([]);

  // Planificacion de hoy
  const [temaPlanificado, setTemaPlanificado] = useState<string | null>(null);
  const [planEstado, setPlanEstado] = useState<string | null>(null);

  // Programa anual state
  const [programaContenido, setProgramaContenido] = useState("");
  const [programaId, setProgramaId] = useState<string | null>(null);
  const [programaArchivoUrl, setProgramaArchivoUrl] = useState<string | null>(null);
  const [programaArchivoNombre, setProgramaArchivoNombre] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [programaEstructura, setProgramaEstructura] = useState<any>(null);
  const [savingEstructura, setSavingEstructura] = useState(false);
  const [editClaseOpen, setEditClaseOpen] = useState(false);
  const [editDias, setEditDias] = useState<string[]>([]);
  const [editHora, setEditHora] = useState("");
  const [editAula, setEditAula] = useState("");
  const [savingClase, setSavingClase] = useState(false);

  const isInitialLoad = useRef(true);

  // Refs for stale closure fix
  const asistenciaRef = useRef(asistencia);
  asistenciaRef.current = asistencia;
  const notasRef = useRef(notasState);
  notasRef.current = notasState;
  const obsRef = useRef(obsState);
  obsRef.current = obsState;
  const diarioTemaRef = useRef(diarioTema);
  diarioTemaRef.current = diarioTema;
  const diarioActividadRef = useRef(diarioActividad);
  diarioActividadRef.current = diarioActividad;
  const diarioObsRef = useRef(diarioObs);
  diarioObsRef.current = diarioObs;
  const diarioIdRef = useRef(diarioId);
  diarioIdRef.current = diarioId;
  const participacionRef = useRef(participacion);
  participacionRef.current = participacion;

  // ========== DATA FETCHING ==========
  useEffect(() => {
    if (!user || !claseId) return;
    const fetchAll = async () => {
      setLoading(true);
      isInitialLoad.current = true;
      const { data: claseData } = await supabase.from("clases").select("*").eq("id", claseId).maybeSingle();
      if (!claseData) { setLoading(false); return; }
      setClase(claseData);

      const [matRes, grpRes, estRes, evRes, asistRes, diarioRes, planRes, partRes] = await Promise.all([
        supabase.from("materias").select("*").eq("id", claseData.materia_id).maybeSingle(),
        supabase.from("grupos").select("*").eq("id", claseData.grupo_id).maybeSingle(),
        supabase.from("estudiantes").select("*").eq("grupo_id", claseData.grupo_id).order("nombre_completo"),
        supabase.from("evaluaciones").select("*").eq("clase_id", claseId),
        supabase.from("asistencia").select("*").eq("clase_id", claseId).eq("fecha", selectedDateISO),
        supabase.from("diario_clase").select("*").eq("clase_id", claseId).eq("fecha", selectedDateISO).maybeSingle(),
        supabase.from("planificacion_clases").select("tema_titulo, estado").eq("clase_id", claseId).eq("fecha", selectedDateISO),
        supabase.from("participacion_clase" as any).select("*").eq("clase_id", claseId).eq("fecha", selectedDateISO),
      ]);
      setMateria(matRes.data);
      setGrupo(grpRes.data);
      const estudiantes = estRes.data || [];
      setEstudiantesClase(estudiantes);
      setEvaluacionesClase(evRes.data || []);

      // Planificacion
      const planData = (planRes.data || []) as any[];
      if (planData.length > 0) {
        setTemaPlanificado(planData[0].tema_titulo);
        setPlanEstado(planData[0].estado);
      } else {
        setTemaPlanificado(null);
        setPlanEstado(null);
      }

      // Load participacion
      const partMap: Record<string, NivelParticipacion | null> = {};
      ((partRes.data as any[]) || []).forEach((p: any) => { partMap[p.estudiante_id] = p.nivel; });
      setParticipacion(partMap);

      // ========== ASISTENCIA: Default all to "presente" if no records ==========
      const existingAsist = asistRes.data || [];
      if (existingAsist.length === 0 && !isReadonly) {
        // Auto-default all to presente
        const defaultAsist: Record<string, EstadoAsistencia> = {};
        estudiantes.forEach(e => { defaultAsist[e.id] = "presente"; });
        setAsistencia(defaultAsist);

        // Persist defaults to DB
        if (estudiantes.length > 0) {
          const records = estudiantes.map(e => ({
            clase_id: claseId,
            estudiante_id: e.id,
            estado: "presente" as const,
            fecha: selectedDateISO,
            user_id: user.id,
          }));
          await supabase.from("asistencia").insert(records);
        }
        // Switch to attendance tab for review
        setModoActivo("asistencia");
      } else {
        const asistMap: Record<string, EstadoAsistencia> = {};
        existingAsist.forEach(a => { asistMap[a.estudiante_id] = a.estado as EstadoAsistencia; });
        setAsistencia(asistMap);
      }

      // ========== DIARIO: Auto-create if not exists ==========
      if (diarioRes.data) {
        setDiarioId(diarioRes.data.id);
        setDiarioTema(diarioRes.data.tema_trabajado || "");
        setDiarioActividad(diarioRes.data.actividad_realizada || "");
        setDiarioObs(diarioRes.data.observaciones || "");
      } else if (!isReadonly) {
        // Auto-create diario entry
        const autoTema = planData.length > 0 ? planData[0].tema_titulo : null;
        const { data: newDiario } = await supabase.from("diario_clase").insert({
          clase_id: claseId, user_id: user.id, fecha: selectedDateISO,
          tema_trabajado: autoTema || null,
        }).select("id").maybeSingle();
        if (newDiario) {
          setDiarioId(newDiario.id);
          setDiarioTema(autoTema || "");
        }
        setDiarioActividad("");
        setDiarioObs("");
      } else {
        setDiarioId(null);
        setDiarioTema("");
        setDiarioActividad("");
        setDiarioObs("");
      }

      // Load diary suggestions
      const { data: prevDiarios } = await supabase.from("diario_clase")
        .select("tema_trabajado").eq("clase_id", claseId)
        .not("tema_trabajado", "is", null)
        .neq("fecha", selectedDateISO)
        .order("fecha", { ascending: false }).limit(5);
      const temas = (prevDiarios || []).map(d => d.tema_trabajado).filter(Boolean) as string[];
      setDiarioSugerencias([...new Set(temas)]);

      // Load notas
      const evIds = (evRes.data || []).map(e => e.id);
      if (evIds.length > 0) {
        const { data: notasData } = await supabase.from("notas").select("*").in("evaluacion_id", evIds);
        const nMap: Record<string, string> = {};
        (notasData || []).forEach(n => { if (n.nota !== null) nMap[`${n.evaluacion_id}-${n.estudiante_id}`] = String(n.nota); });
        setNotasState(nMap);
      } else {
        setNotasState({});
      }

      // Load observaciones
      const { data: obsData } = await supabase.from("observaciones").select("*").eq("clase_id", claseId).eq("fecha", selectedDateISO);
      const oMap: Record<string, string[]> = {};
      (obsData || []).forEach(o => {
        if (!oMap[o.estudiante_id]) oMap[o.estudiante_id] = [];
        oMap[o.estudiante_id].push(o.tipo);
      });
      setObsState(oMap);

      // Load programa anual
      const { data: progData } = await supabase.from("programas_anuales").select("*").eq("clase_id", claseId).maybeSingle();
      if (progData) {
        setProgramaId(progData.id);
        setProgramaContenido(progData.contenido || "");
        setProgramaArchivoUrl(progData.archivo_url || null);
        setProgramaArchivoNombre(progData.archivo_nombre || null);
        setProgramaEstructura((progData as any).contenido_estructurado || null);
      }

      setLoading(false);
      setTimeout(() => { isInitialLoad.current = false; }, 500);
    };
    fetchAll();
  }, [user, claseId, selectedDateISO]);

  // ========== SAVE CALLBACKS ==========
  const saveAsistenciaFn = useCallback(async () => {
    if (!user || !claseId) return;
    const currentAsist = asistenciaRef.current;
    for (const [estudiante_id, estado] of Object.entries(currentAsist)) {
      if (estado) {
        const { data: existing } = await supabase.from("asistencia")
          .select("id").eq("clase_id", claseId).eq("estudiante_id", estudiante_id).eq("fecha", selectedDateISO).maybeSingle();
        if (existing) {
          await supabase.from("asistencia").update({ estado }).eq("id", existing.id);
        } else {
          await supabase.from("asistencia").insert({ clase_id: claseId, estudiante_id, estado, fecha: selectedDateISO, user_id: user.id });
        }
      } else {
        await supabase.from("asistencia").delete().eq("clase_id", claseId).eq("estudiante_id", estudiante_id).eq("fecha", selectedDateISO);
      }
    }
  }, [claseId, user, selectedDateISO]);

  const saveNotasFn = useCallback(async () => {
    if (!user || !claseId) return;
    const currentNotas = notasRef.current;
    const entries = Object.entries(currentNotas).filter(([, v]) => v.trim() !== "");
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
  }, [user, claseId]);

  const saveObservacionesFn = useCallback(async () => {
    if (!user || !claseId) return;
    const currentObs = obsRef.current;
    await supabase.from("observaciones").delete().eq("clase_id", claseId).eq("fecha", selectedDateISO);
    const records: any[] = [];
    Object.entries(currentObs).forEach(([estudiante_id, tipos]) => {
      tipos.forEach(tipo => {
        records.push({
          clase_id: claseId, estudiante_id, tipo: tipo as any,
          descripcion: tagObservaciones.find(t => t.tipo === tipo)?.label || tipo,
          fecha: selectedDateISO, user_id: user.id,
        });
      });
    });
    if (records.length > 0) await supabase.from("observaciones").insert(records);
  }, [claseId, user, selectedDateISO]);

  const saveDiarioFn = useCallback(async () => {
    if (!user || !claseId) return;
    const tema = diarioTemaRef.current;
    const actividad = diarioActividadRef.current;
    const obs = diarioObsRef.current;
    let currentDiarioId = diarioIdRef.current;
    if (currentDiarioId) {
      await supabase.from("diario_clase").update({
        tema_trabajado: tema || null,
        actividad_realizada: actividad || null,
        observaciones: obs || null,
      }).eq("id", currentDiarioId);
    } else {
      const { data } = await supabase.from("diario_clase").insert({
        clase_id: claseId,
        tema_trabajado: tema || null,
        actividad_realizada: actividad || null,
        observaciones: obs || null,
        user_id: user.id, fecha: selectedDateISO,
      }).select("id").maybeSingle();
      if (data) { setDiarioId(data.id); currentDiarioId = data.id; }
    }

    // Auto-update planificacion
    if (tema && tema.trim()) {
      const { data: todayPlan } = await supabase
        .from("planificacion_clases")
        .select("id, estado")
        .eq("clase_id", claseId)
        .eq("fecha", selectedDateISO)
        .eq("estado", "pendiente" as any);
      if (todayPlan && todayPlan.length > 0) {
        await supabase.from("planificacion_clases")
          .update({ estado: "completado" as any, diario_id: currentDiarioId })
          .eq("id", todayPlan[0].id);
        setPlanEstado("completado");
      }
    }
  }, [claseId, user, selectedDateISO]);

  const saveParticipacionFn = useCallback(async () => {
    if (!user || !claseId) return;
    const currentPart = participacionRef.current;
    for (const [estudiante_id, nivel] of Object.entries(currentPart)) {
      if (nivel) {
        const { data: existing } = await (supabase.from("participacion_clase" as any) as any)
          .select("id").eq("clase_id", claseId).eq("estudiante_id", estudiante_id).eq("fecha", selectedDateISO).maybeSingle();
        if (existing) {
          await (supabase.from("participacion_clase" as any) as any).update({ nivel }).eq("id", existing.id);
        } else {
          await (supabase.from("participacion_clase" as any) as any).insert({ clase_id: claseId, estudiante_id, nivel, fecha: selectedDateISO, user_id: user.id });
        }
      } else {
        await (supabase.from("participacion_clase" as any) as any).delete().eq("clase_id", claseId).eq("estudiante_id", estudiante_id).eq("fecha", selectedDateISO);
      }
    }
  }, [claseId, user, selectedDateISO]);

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
  const partDebounce = useDebounceCallback(saveParticipacionFn, 2000);
  const programaDebounce = useDebounceCallback(saveProgramaFn, 3000);

  const currentStatus = modoActivo === "asistencia" ? asistDebounce.status
    : modoActivo === "notas" ? notasDebounce.status
    : modoActivo === "observaciones" ? obsDebounce.status
    : modoActivo === "diario" ? diarioDebounce.status : "idle";

  // ========== COMPUTED STATS ==========
  const asistenciaStats = useMemo(() => {
    const total = estudiantesClase.length;
    const presentes = Object.values(asistencia).filter(v => v === "presente").length;
    const faltas = Object.values(asistencia).filter(v => v === "falta").length;
    const tardes = Object.values(asistencia).filter(v => v === "tarde").length;
    return { total, presentes, faltas, tardes };
  }, [asistencia, estudiantesClase.length]);

  const obsStats = useMemo(() => Object.values(obsState).reduce((acc, arr) => acc + arr.length, 0), [obsState]);

  const partStats = useMemo(() => {
    const vals = Object.values(participacion).filter(Boolean);
    return { alta: vals.filter(v => v === "alta").length, media: vals.filter(v => v === "media").length, baja: vals.filter(v => v === "baja").length };
  }, [participacion]);

  const tabBadges = useMemo<TabBadges>(() => ({
    asistencia: {
      complete: estudiantesClase.length > 0 && Object.values(asistencia).filter(Boolean).length === estudiantesClase.length,
      missing: estudiantesClase.length - Object.values(asistencia).filter(Boolean).length,
    },
    notas: {
      sinNota: evaluacionActiva
        ? estudiantesClase.filter(e => !notasState[`${evaluacionActiva}-${e.id}`]?.trim()).length
        : 0,
    },
    observaciones: { count: obsStats },
    diario: { complete: !!diarioTema.trim() },
  }), [estudiantesClase, asistencia, notasState, evaluacionActiva, obsStats, diarioTema]);

  // ========== EVENT HANDLERS ==========
  const marcarAsistencia = (estId: string, estado: EstadoAsistencia) => {
    setAsistencia(prev => ({ ...prev, [estId]: prev[estId] === estado ? null : estado }));
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
    if (!isInitialLoad.current) partDebounce.trigger();
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
    if (error) { toast.error("Error al subir archivo"); setUploadingFile(false); return; }
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

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setModoActivo("resumen");
  };

  const openEditClase = () => {
    const parsed = parseHorarioToState(clase?.horario || null);
    setEditDias(parsed.dias);
    setEditHora(parsed.hora);
    setEditAula(clase?.aula || "");
    setEditClaseOpen(true);
  };

  const saveClaseDetails = async () => {
    if (!claseId) return;
    setSavingClase(true);
    const newHorario = buildHorarioString(editDias, editHora);
    const { error } = await supabase.from("clases").update({ horario: newHorario, aula: editAula.trim() || null }).eq("id", claseId);
    setSavingClase(false);
    if (error) { toast.error("Error al guardar"); return; }
    setClase((prev: any) => ({ ...prev, horario: newHorario, aula: editAula.trim() || null }));
    setEditClaseOpen(false);
    toast.success("Clase actualizada");
  };

  // ========== RENDER ==========
  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (!clase || !grupo || !materia) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">Clase no encontrada</p>
        <Button variant="outline" onClick={() => navigate("/")}>Volver al panel</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-6">
      <ClaseHeader
        materiaName={materia.nombre}
        grupoName={grupo.nombre}
        horario={clase.horario}
        aula={clase.aula}
        studentCount={estudiantesClase.length}
        hasProgramaEstructura={!!programaEstructura}
        modoActivo={modoActivo}
        selectedDate={selectedDate}
        isReadonly={isReadonly}
        isPastDate={isPastDate}
        saveStatus={currentStatus}
        tabBadges={tabBadges}
        onBack={() => navigate(-1)}
        onEditClase={openEditClase}
        onShowPrograma={() => setShowProgramaDialog(true)}
        onModoChange={setModoActivo}
        onDateChange={handleDateChange}
      />

      {modoActivo === "resumen" && (
        <ResumenTab
          temaPlanificado={temaPlanificado}
          planEstado={planEstado}
          asistenciaStats={asistenciaStats}
          partStats={partStats}
          evaluacionesCount={evaluacionesClase.length}
          obsStats={obsStats}
          diarioTema={diarioTema}
          onNavigate={setModoActivo}
        />
      )}

      {modoActivo === "asistencia" && (
        <AsistenciaTab
          estudiantes={estudiantesClase}
          asistencia={asistencia}
          participacion={participacion}
          stats={asistenciaStats}
          isReadonly={isReadonly}
          onMarcarAsistencia={marcarAsistencia}
          onMarcarTodosPresentes={marcarTodosPresentes}
          onMarcarParticipacion={marcarParticipacion}
          onStudentDetail={setStudentDetailId}
        />
      )}

      {modoActivo === "notas" && (
        <NotasTab
          estudiantes={estudiantesClase}
          evaluaciones={evaluacionesClase}
          evaluacionActiva={evaluacionActiva}
          notasState={notasState}
          isReadonly={isReadonly}
          onEvaluacionChange={setEvaluacionActiva}
          onNotaChange={handleNotaChange}
          onStudentDetail={setStudentDetailId}
        />
      )}

      {modoActivo === "observaciones" && (
        <ObservacionesTab
          estudiantes={estudiantesClase}
          obsState={obsState}
          obsStats={obsStats}
          isReadonly={isReadonly}
          onToggleObservacion={toggleObservacion}
          onStudentDetail={setStudentDetailId}
        />
      )}

      {modoActivo === "diario" && (
        <DiarioTab
          diarioTema={diarioTema}
          diarioActividad={diarioActividad}
          diarioObs={diarioObs}
          temaPlanificado={temaPlanificado}
          diarioSugerencias={diarioSugerencias}
          isReadonly={isReadonly}
          onChange={handleDiarioChange}
        />
      )}

      <StudentDetailSheet studentId={studentDetailId} claseId={claseId || ""} open={!!studentDetailId} onClose={() => setStudentDetailId(null)} />

      {/* Programa Dialog */}
      <Dialog open={showProgramaDialog} onOpenChange={setShowProgramaDialog}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Programa y planificación</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Contenido del programa anual</Label>
              <Textarea placeholder="Pegá aquí el contenido del programa anual..." value={programaContenido} onChange={e => handleProgramaChange(e.target.value)} rows={6} className="text-sm leading-relaxed" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Archivo adjunto</Label>
              {programaArchivoNombre ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/40 border">
                  <FileText className="h-5 w-5 text-primary shrink-0" />
                  <span className="text-sm font-medium truncate flex-1">{programaArchivoNombre}</span>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={handleRemoveFile}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ) : (
                <label className="flex items-center gap-2 p-4 rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 cursor-pointer transition-colors">
                  {uploadingFile ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
                  <span className="text-sm text-muted-foreground">{uploadingFile ? "Subiendo..." : "Subir archivo"}</span>
                  <input type="file" className="hidden" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt" onChange={handleProgramaFileUpload} disabled={uploadingFile} />
                </label>
              )}
            </div>
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
                        await supabase.from("programas_anuales").update({ contenido_estructurado: est as any }).eq("id", programaId);
                      } else {
                        const { data } = await supabase.from("programas_anuales").insert({
                          clase_id: claseId!, user_id: user!.id, contenido: programaContenido || null, contenido_estructurado: est as any,
                        }).select("id").maybeSingle();
                        if (data) setProgramaId(data.id);
                      }
                      setProgramaEstructura(est);
                    } catch { toast.error("Error al guardar la estructura"); }
                    finally { setSavingEstructura(false); }
                  }}
                />
              </div>
            )}
            {programaEstructura && (
              <div className="space-y-2 pt-2 border-t">
                <Label className="text-sm font-semibold">Planificación anual</Label>
                <PlanificacionTimeline claseId={claseId!} userId={user!.id} horario={clase?.horario || null} estructura={programaEstructura} />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Clase Dialog */}
      <Dialog open={editClaseOpen} onOpenChange={setEditClaseOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar clase</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Días de clase</Label>
              <div className="flex flex-wrap gap-2">
                {DIAS_SEMANA.map(dia => (
                  <button key={dia.key} type="button"
                    onClick={() => setEditDias(prev => prev.includes(dia.key) ? prev.filter(d => d !== dia.key) : [...prev, dia.key])}
                    className={cn("px-3 py-2 rounded-lg text-sm font-medium border transition-all active:scale-95",
                      editDias.includes(dia.key) ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                    )}>
                    {dia.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-hora">Horario (opcional)</Label>
              <Input id="edit-hora" placeholder="Ej: 8:00-9:30" value={editHora} onChange={e => setEditHora(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-aula">Aula</Label>
              <Input id="edit-aula" placeholder="Ej: Aula 12" value={editAula} onChange={e => setEditAula(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditClaseOpen(false)}>Cancelar</Button>
            <Button onClick={saveClaseDetails} disabled={savingClase}>
              {savingClase ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
