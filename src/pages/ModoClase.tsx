import { useParams, useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { StudentDetailSheet } from "@/components/clase/StudentDetailSheet";
import { ClaseHeader } from "@/components/clase/ClaseHeader";
import { ResumenTab } from "@/components/clase/tabs/ResumenTab";
import { AsistenciaTab } from "@/components/clase/tabs/AsistenciaTab";
import { NotasTab } from "@/components/clase/tabs/NotasTab";
import { ObservacionesTab } from "@/components/clase/tabs/ObservacionesTab";
import { DiarioTab } from "@/components/clase/tabs/DiarioTab";
import { DesempenoTab } from "@/components/clase/tabs/DesempenoTab";
import { ProgramaTab } from "@/components/clase/tabs/ProgramaTab";
import { TareaSheet } from "@/components/clase/tabs/TareaSheet";
import type { DesempenoCategoria, DesempenoRecord } from "@/components/clase/tabs/DesempenoTab";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDebounceCallback } from "@/hooks/useDebounce";
import { tagObservaciones } from "@/components/clase/types";
import type { ModoActivo, EstadoAsistencia, NivelParticipacion, NivelDesempeno, TabBadges } from "@/components/clase/types";

const DIAS_SEMANA = [
  { key: "Lun", label: "Lun" }, { key: "Mar", label: "Mar" }, { key: "Mié", label: "Mié" },
  { key: "Jue", label: "Jue" }, { key: "Vie", label: "Vie" }, { key: "Sáb", label: "Sáb" },
];

const HORA_OPTIONS = (() => {
  const opts: string[] = [];
  for (let h = 7; h <= 22; h++) {
    opts.push(`${h}:00`);
    if (h < 22) opts.push(`${h}:30`);
  }
  return opts;
})();

const parseHorarioToState = (horario: string | null) => {
  if (!horario) return { dias: [] as string[], horaInicio: "", horaFin: "" };
  const diasFound: string[] = [];
  const lower = horario.toLowerCase();
  const map: Record<string, string> = { lun: "Lun", mar: "Mar", "mié": "Mié", mie: "Mié", jue: "Jue", vie: "Vie", "sáb": "Sáb", sab: "Sáb" };
  for (const [k, v] of Object.entries(map)) {
    if (lower.includes(k) && !diasFound.includes(v)) diasFound.push(v);
  }
  const rangeMatch = horario.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
  if (rangeMatch) {
    return { dias: diasFound, horaInicio: rangeMatch[1], horaFin: rangeMatch[2] };
  }
  const singleMatch = horario.match(/(\d{1,2}:\d{2})/);
  return { dias: diasFound, horaInicio: singleMatch ? singleMatch[1] : "", horaFin: "" };
};

const buildHorarioString = (dias: string[], horaInicio: string, horaFin: string) => {
  if (dias.length === 0) return null;
  const ordered = DIAS_SEMANA.filter(d => dias.includes(d.key)).map(d => d.key);
  const horaPart = horaInicio && horaFin ? `${horaInicio}-${horaFin}` : horaInicio || "";
  return `${ordered.join("/")}${horaPart ? " " + horaPart : ""}`;
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
  const [desempeno, setDesempeno] = useState<Record<string, DesempenoRecord>>({});
  const [notasState, setNotasState] = useState<Record<string, string>>({});
  const [obsState, setObsState] = useState<Record<string, string[]>>({});
  const [evaluacionActiva, setEvaluacionActiva] = useState<string | null>(null);
  const [studentDetailId, setStudentDetailId] = useState<string | null>(null);
  const [planificacionStats, setPlanificacionStats] = useState<{ completados: number; total: number }>({ completados: 0, total: 0 });
  const [tareaSheetOpen, setTareaSheetOpen] = useState(false);
  const [hasTareaHoy, setHasTareaHoy] = useState(false);

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
  const [editHoraInicio, setEditHoraInicio] = useState("");
  const [editHoraFin, setEditHoraFin] = useState("");
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
  const desempenoRef = useRef(desempeno);
  desempenoRef.current = desempeno;

  // ========== DATA FETCHING ==========
  useEffect(() => {
    if (!user || !claseId) return;
    const fetchAll = async () => {
      setLoading(true);
      isInitialLoad.current = true;
      const { data: claseData } = await supabase.from("clases").select("*").eq("id", claseId).maybeSingle();
      if (!claseData) { setLoading(false); return; }
      setClase(claseData);

      const [matRes, grpRes, estRes, evRes, asistRes, diarioRes, planRes, partRes, desRes] = await Promise.all([
        supabase.from("materias").select("*").eq("id", claseData.materia_id).maybeSingle(),
        supabase.from("grupos").select("*").eq("id", claseData.grupo_id).maybeSingle(),
        supabase.from("estudiantes").select("*").eq("grupo_id", claseData.grupo_id).order("nombre_completo"),
        supabase.from("evaluaciones").select("*").eq("clase_id", claseId),
        supabase.from("asistencia").select("*").eq("clase_id", claseId).eq("fecha", selectedDateISO),
        supabase.from("diario_clase").select("*").eq("clase_id", claseId).eq("fecha", selectedDateISO).maybeSingle(),
        supabase.from("planificacion_clases").select("tema_titulo, estado").eq("clase_id", claseId).eq("fecha", selectedDateISO),
        supabase.from("participacion_clase" as any).select("*").eq("clase_id", claseId).eq("fecha", selectedDateISO),
        supabase.from("desempeno_diario" as any).select("*").eq("clase_id", claseId).eq("fecha", selectedDateISO),
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

      // Load desempeno
      const desMap: Record<string, DesempenoRecord> = {};
      ((desRes.data as any[]) || []).forEach((d: any) => {
        desMap[d.estudiante_id] = {
          tarea: d.tarea || null,
          participacion_oral: d.participacion_oral || null,
          rendimiento_aula: d.rendimiento_aula || null,
          conducta: d.conducta || null,
        };
      });
      setDesempeno(desMap);

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

      // Load planificacion stats
      const { data: allPlanData } = await supabase.from("planificacion_clases")
        .select("estado").eq("clase_id", claseId);
      const allPlan = allPlanData || [];
      setPlanificacionStats({
        total: allPlan.length,
        completados: allPlan.filter((p: any) => p.estado === "completado" || p.estado === "parcial").length,
      });

      // Check if tareas exist for today
      const startOfDay = `${selectedDateISO}T00:00:00.000Z`;
      const endOfDay = `${selectedDateISO}T23:59:59.999Z`;
      const { data: tareasHoy } = await supabase.from("tareas")
        .select("id").eq("clase_id", claseId)
        .gte("created_at", startOfDay).lte("created_at", endOfDay).limit(1);
      setHasTareaHoy((tareasHoy || []).length > 0);

      setLoading(false);
      setTimeout(() => { isInitialLoad.current = false; }, 500);
    };
    fetchAll();
  }, [user, claseId, selectedDateISO]);

  // ========== SAVE CALLBACKS ==========
  const saveAsistenciaFn = useCallback(async () => {
    if (!user || !claseId) return;
    const currentAsist = asistenciaRef.current;
    const { error: delErr } = await supabase.from("asistencia").delete().eq("clase_id", claseId).eq("fecha", selectedDateISO);
    if (delErr) { toast.error("Error al guardar asistencia"); return; }
    const records = Object.entries(currentAsist)
      .filter(([, estado]) => estado !== null)
      .map(([estudiante_id, estado]) => ({
        clase_id: claseId, estudiante_id, estado: estado!, fecha: selectedDateISO, user_id: user.id,
      }));
    if (records.length > 0) {
      const { error: insErr } = await supabase.from("asistencia").insert(records);
      if (insErr) toast.error("Error al guardar asistencia");
    }
  }, [claseId, user, selectedDateISO]);

  const saveNotasFn = useCallback(async () => {
    if (!user || !claseId) return;
    const currentNotas = notasRef.current;
    const evIds = new Set<string>();
    const records: { evaluacion_id: string; estudiante_id: string; nota: number; user_id: string }[] = [];
    for (const [key, val] of Object.entries(currentNotas)) {
      if (val.trim() === "") continue;
      const evaluacion_id = key.substring(0, 36);
      const estudiante_id = key.substring(37);
      const nota = parseFloat(val);
      if (isNaN(nota)) continue;
      evIds.add(evaluacion_id);
      records.push({ evaluacion_id, estudiante_id, nota, user_id: user.id });
    }
    if (evIds.size > 0) {
      const { error: delErr } = await supabase.from("notas").delete().in("evaluacion_id", Array.from(evIds));
      if (delErr) { toast.error("Error al guardar notas"); return; }
    }
    if (records.length > 0) {
      const { error: insErr } = await supabase.from("notas").insert(records);
      if (insErr) toast.error("Error al guardar notas");
    }
  }, [user, claseId]);

  const saveObservacionesFn = useCallback(async () => {
    if (!user || !claseId) return;
    const currentObs = obsRef.current;
    const { error: delErr } = await supabase.from("observaciones").delete().eq("clase_id", claseId).eq("fecha", selectedDateISO);
    if (delErr) { toast.error("Error al guardar observaciones"); return; }
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
    if (records.length > 0) {
      const { error: insErr } = await supabase.from("observaciones").insert(records);
      if (insErr) toast.error("Error al guardar observaciones");
    }
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
    const { error: delErr } = await (supabase.from("participacion_clase" as any) as any).delete().eq("clase_id", claseId).eq("fecha", selectedDateISO);
    if (delErr) { toast.error("Error al guardar participación"); return; }
    const records = Object.entries(currentPart)
      .filter(([, nivel]) => nivel !== null)
      .map(([estudiante_id, nivel]) => ({
        clase_id: claseId, estudiante_id, nivel, fecha: selectedDateISO, user_id: user.id,
      }));
    if (records.length > 0) {
      const { error: insErr } = await (supabase.from("participacion_clase" as any) as any).insert(records);
      if (insErr) toast.error("Error al guardar participación");
    }
  }, [claseId, user, selectedDateISO]);

  const saveDesempenoFn = useCallback(async () => {
    if (!user || !claseId) return;
    const currentDes = desempenoRef.current;
    const { error: delErr } = await (supabase.from("desempeno_diario" as any) as any).delete().eq("clase_id", claseId).eq("fecha", selectedDateISO);
    if (delErr) { toast.error("Error al guardar desempeño"); return; }
    const records = Object.entries(currentDes)
      .filter(([, r]) => r.tarea || r.participacion_oral || r.rendimiento_aula || r.conducta)
      .map(([estudiante_id, r]) => ({
        clase_id: claseId, estudiante_id, fecha: selectedDateISO, user_id: user.id,
        tarea: r.tarea, participacion_oral: r.participacion_oral,
        rendimiento_aula: r.rendimiento_aula, conducta: r.conducta,
      }));
    if (records.length > 0) {
      const { error: insErr } = await (supabase.from("desempeno_diario" as any) as any).insert(records);
      if (insErr) toast.error("Error al guardar desempeño");
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
  const desempenoDebounce = useDebounceCallback(saveDesempenoFn, 2000);
  const programaDebounce = useDebounceCallback(saveProgramaFn, 3000);

  const currentStatus = modoActivo === "asistencia" ? asistDebounce.status
    : modoActivo === "notas" ? notasDebounce.status
    : modoActivo === "observaciones" ? obsDebounce.status
    : modoActivo === "diario" ? diarioDebounce.status
    : modoActivo === "desempeno" ? desempenoDebounce.status
    : modoActivo === "programa" ? programaDebounce.status : "idle";

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

  const tabBadges = useMemo<TabBadges>(() => {
    const desCount = Object.values(desempeno).filter(d => d.tarea || d.participacion_oral || d.rendimiento_aula || d.conducta).length;
    return {
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
      desempeno: { count: desCount, total: estudiantesClase.length },
      programa: { hasContent: !!programaEstructura },
    };
  }, [estudiantesClase, asistencia, notasState, evaluacionActiva, obsStats, diarioTema, desempeno, programaEstructura]);

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

  const cambiarDesempeno = useCallback((estId: string, categoria: DesempenoCategoria, nivel: NivelDesempeno) => {
    setDesempeno(prev => {
      const current = prev[estId] || { tarea: null, participacion_oral: null, rendimiento_aula: null, conducta: null };
      return { ...prev, [estId]: { ...current, [categoria]: nivel } };
    });
    if (!isInitialLoad.current) desempenoDebounce.trigger();
  }, [desempenoDebounce]);

  const marcarTodosDesempenoA = () => {
    const nuevo: Record<string, DesempenoRecord> = {};
    estudiantesClase.forEach(e => {
      nuevo[e.id] = { tarea: "A", participacion_oral: "A", rendimiento_aula: "A", conducta: "A" };
    });
    setDesempeno(nuevo);
    if (!isInitialLoad.current) desempenoDebounce.trigger();
    toast.success("✓ Todos marcados con A");
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
    setEditHoraInicio(parsed.horaInicio);
    setEditHoraFin(parsed.horaFin);
    setEditAula(clase?.aula || "");
    setEditClaseOpen(true);
  };

  const saveClaseDetails = async () => {
    if (!claseId) return;
    setSavingClase(true);
    const newHorario = buildHorarioString(editDias, editHoraInicio, editHoraFin);
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
        modoActivo={modoActivo}
        selectedDate={selectedDate}
        isReadonly={isReadonly}
        isPastDate={isPastDate}
        saveStatus={currentStatus}
        tabBadges={tabBadges}
        onBack={() => navigate(-1)}
        onEditClase={openEditClase}
        onModoChange={setModoActivo}
        onDateChange={handleDateChange}
      />

      {modoActivo === "resumen" && (
        <ResumenTab
          temaPlanificado={temaPlanificado}
          planEstado={planEstado}
          asistenciaStats={asistenciaStats}
          desempenoCount={tabBadges.desempeno.count}
          desempenoTotal={tabBadges.desempeno.total}
          evaluacionesCount={evaluacionesClase.length}
          obsStats={obsStats}
          diarioTema={diarioTema}
          planificacionStats={planificacionStats}
          onNavigate={setModoActivo}
        />
      )}

      {modoActivo === "asistencia" && (
        <AsistenciaTab
          estudiantes={estudiantesClase}
          asistencia={asistencia}
          stats={asistenciaStats}
          isReadonly={isReadonly}
          onMarcarAsistencia={marcarAsistencia}
          onMarcarTodosPresentes={marcarTodosPresentes}
          onStudentDetail={setStudentDetailId}
        />
      )}

      {modoActivo === "desempeno" && (
        <DesempenoTab
          estudiantes={estudiantesClase}
          desempeno={desempeno}
          isReadonly={isReadonly}
          hasTareaHoy={hasTareaHoy}
          onCambiarDesempeno={cambiarDesempeno}
          onMarcarTodosA={marcarTodosDesempenoA}
          onStudentDetail={setStudentDetailId}
          onTareaHeaderClick={() => setTareaSheetOpen(true)}
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
          planEstado={planEstado}
          diarioSugerencias={diarioSugerencias}
          isReadonly={isReadonly}
          planificacionStats={planificacionStats}
          onChange={handleDiarioChange}
          onChangePlanEstado={async (estado) => {
            if (!claseId) return;
            const { data: todayPlan } = await supabase
              .from("planificacion_clases")
              .select("id")
              .eq("clase_id", claseId)
              .eq("fecha", selectedDateISO);
            if (todayPlan && todayPlan.length > 0) {
              await supabase.from("planificacion_clases")
                .update({ estado: estado as any, diario_id: diarioId })
                .eq("id", todayPlan[0].id);
              setPlanEstado(estado);
              // Refresh stats
              const { data: allPlanData } = await supabase.from("planificacion_clases")
                .select("estado").eq("clase_id", claseId);
              const allPlan = allPlanData || [];
              setPlanificacionStats({
                total: allPlan.length,
                completados: allPlan.filter((p: any) => p.estado === "completado" || p.estado === "parcial").length,
              });
              toast.success("Estado actualizado");
            }
          }}
          onNavigatePrograma={() => setModoActivo("programa")}
        />
      )}

      {modoActivo === "programa" && (
        <ProgramaTab
          claseId={claseId!}
          userId={user!.id}
          horario={clase?.horario || null}
          programaContenido={programaContenido}
          programaArchivoUrl={programaArchivoUrl}
          programaArchivoNombre={programaArchivoNombre}
          programaEstructura={programaEstructura}
          uploadingFile={uploadingFile}
          savingEstructura={savingEstructura}
          onContenidoChange={handleProgramaChange}
          onFileUpload={handleProgramaFileUpload}
          onRemoveFile={handleRemoveFile}
          onSaveEstructura={async (est) => {
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
      )}

      <StudentDetailSheet studentId={studentDetailId} claseId={claseId || ""} open={!!studentDetailId} onClose={() => setStudentDetailId(null)} />

      <TareaSheet
        open={tareaSheetOpen}
        onClose={() => setTareaSheetOpen(false)}
        claseId={claseId!}
        userId={user!.id}
        fecha={selectedDateISO}
        isReadonly={isReadonly}
        onTareaChange={setHasTareaHoy}
      />

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
              <Label>Horario (opcional)</Label>
              <div className="flex items-center gap-2">
                <Select value={editHoraInicio} onValueChange={setEditHoraInicio}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Inicio" />
                  </SelectTrigger>
                  <SelectContent>
                    {HORA_OPTIONS.map(h => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground">—</span>
                <Select value={editHoraFin} onValueChange={setEditHoraFin}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Fin" />
                  </SelectTrigger>
                  <SelectContent>
                    {HORA_OPTIONS.map(h => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
