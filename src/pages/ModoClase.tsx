import { useParams, useNavigate } from "react-router-dom";
import { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ArrowLeft, UserCheck, ClipboardCheck, MessageSquare,
  Check, X, Clock, LogOut, CheckCheck, Star,
  ThumbsUp, AlertCircle, BookX, Brain, History,
} from "lucide-react";
import {
  clases, estudiantes, getClaseLabel, getClase, evaluaciones,
  grupos, materias,
} from "@/data/mockData";
import { cn } from "@/lib/utils";
import { StudentDetailSheet } from "@/components/clase/StudentDetailSheet";

type ModoActivo = "asistencia" | "notas" | "observaciones" | "participacion";
type EstadoAsistencia = "presente" | "falta" | "tarde" | "retiro" | null;
type NivelParticipacion = "alta" | "media" | "baja";

const tagObservaciones = [
  { id: "buen_desempeno", label: "Buen desempeño", icon: ThumbsUp, color: "bg-success/10 text-success border-success/30" },
  { id: "necesita_apoyo", label: "Necesita apoyo", icon: AlertCircle, color: "bg-warning/10 text-warning border-warning/30" },
  { id: "no_entrega_tareas", label: "No entrega tareas", icon: BookX, color: "bg-destructive/10 text-destructive border-destructive/30" },
  { id: "dificultad_contenidos", label: "Dificultad", icon: Brain, color: "bg-primary/10 text-primary border-primary/30" },
];

export default function ModoClase() {
  const { claseId } = useParams<{ claseId: string }>();
  const navigate = useNavigate();
  const [modoActivo, setModoActivo] = useState<ModoActivo>("asistencia");
  const [asistencia, setAsistencia] = useState<Record<string, EstadoAsistencia>>({});
  const [participacion, setParticipacion] = useState<Record<string, NivelParticipacion | null>>({});
  const [notasState, setNotasState] = useState<Record<string, string>>({});
  const [obsState, setObsState] = useState<Record<string, string[]>>({});
  const [evaluacionActiva, setEvaluacionActiva] = useState<string | null>(null);
  const [studentDetailId, setStudentDetailId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const clase = getClase(claseId || "");
  const grupo = clase ? grupos.find((g) => g.id === clase.grupoId) : null;
  const materia = clase ? materias.find((m) => m.id === clase.materiaId) : null;
  const estudiantesClase = estudiantes.filter((e) => e.grupoId === clase?.grupoId);
  const evaluacionesClase = evaluaciones.filter((ev) => ev.claseId === claseId);

  const hoy = new Date().toLocaleDateString("es-AR", {
    weekday: "short", day: "numeric", month: "short",
  });

  // Auto-save effect
  useEffect(() => {
    const timer = setTimeout(() => {
      const hasData = Object.keys(asistencia).length > 0 ||
        Object.keys(participacion).length > 0 ||
        Object.keys(notasState).length > 0 ||
        Object.keys(obsState).length > 0;
      if (hasData) {
        setLastSaved(new Date());
        // In production this would save to the database
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [asistencia, participacion, notasState, obsState]);

  const asistenciaStats = useMemo(() => {
    const total = estudiantesClase.length;
    const presentes = Object.values(asistencia).filter((v) => v === "presente").length;
    const faltas = Object.values(asistencia).filter((v) => v === "falta").length;
    return { total, presentes, faltas };
  }, [asistencia, estudiantesClase.length]);

  if (!clase || !grupo || !materia) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">Clase no encontrada</p>
        <Button variant="outline" onClick={() => navigate("/")}>Volver al panel</Button>
      </div>
    );
  }

  const marcarAsistencia = (estId: string, estado: EstadoAsistencia) => {
    setAsistencia((prev) => ({
      ...prev,
      [estId]: prev[estId] === estado ? null : estado,
    }));
  };

  const marcarTodosPresentes = () => {
    const nuevaAsistencia: Record<string, EstadoAsistencia> = {};
    estudiantesClase.forEach((e) => { nuevaAsistencia[e.id] = "presente"; });
    setAsistencia(nuevaAsistencia);
    toast.success("✓ Todos presentes");
  };

  const marcarParticipacion = (estId: string, nivel: NivelParticipacion) => {
    setParticipacion((prev) => ({
      ...prev,
      [estId]: prev[estId] === nivel ? null : nivel,
    }));
  };

  const toggleObservacion = (estId: string, obsId: string) => {
    setObsState((prev) => {
      const current = prev[estId] || [];
      const next = current.includes(obsId)
        ? current.filter((id) => id !== obsId)
        : [...current, obsId];
      return { ...prev, [estId]: next };
    });
  };

  const modos = [
    { id: "asistencia" as const, label: "Asistencia", icon: UserCheck },
    { id: "notas" as const, label: "Notas", icon: ClipboardCheck },
    { id: "observaciones" as const, label: "Obs.", icon: MessageSquare },
    { id: "participacion" as const, label: "Partic.", icon: Star },
  ];

  return (
    <div className="max-w-4xl mx-auto pb-6">
      {/* Compact sticky header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b -mx-4 px-4 pt-1 pb-2 md:-mx-0 md:px-0">
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0 h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-base font-display font-bold truncate">
              {materia.nombre} — {grupo.nombre}
            </h1>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] text-muted-foreground capitalize">{hoy}</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {estudiantesClase.length}
            </Badge>
          </div>
        </div>

        {/* Mode tabs */}
        <div className="grid grid-cols-4 gap-1">
          {modos.map((modo) => (
            <button
              key={modo.id}
              className={cn(
                "flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all",
                modoActivo === modo.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
              onClick={() => setModoActivo(modo.id)}
            >
              <modo.icon className="h-3.5 w-3.5" />
              {modo.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mode toolbar */}
      {modoActivo === "asistencia" && (
        <div className="flex items-center justify-between py-2 gap-2">
          <Button
            size="sm"
            className="gap-1.5 bg-success hover:bg-success/90 text-success-foreground h-10 text-sm font-semibold"
            onClick={marcarTodosPresentes}
          >
            <CheckCheck className="h-4 w-4" />
            Todos presentes
          </Button>
          <div className="text-right">
            <span className="text-xs text-muted-foreground block">
              {asistenciaStats.presentes}P · {asistenciaStats.faltas}F
            </span>
          </div>
        </div>
      )}

      {modoActivo === "notas" && (
        <div className="py-2">
          {evaluacionesClase.length > 0 ? (
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {evaluacionesClase.map((ev) => (
                <button
                  key={ev.id}
                  className={cn(
                    "shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                    evaluacionActiva === ev.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 text-muted-foreground"
                  )}
                  onClick={() => setEvaluacionActiva(ev.id)}
                >
                  {ev.titulo}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-1">Sin evaluaciones</p>
          )}
        </div>
      )}

      {/* Student cards */}
      <div className="space-y-1.5 mt-1">
        {estudiantesClase.map((est, idx) => {
          const estado = asistencia[est.id];
          const estadoBg = estado === "presente" ? "border-l-success"
            : estado === "falta" ? "border-l-destructive"
            : estado === "tarde" ? "border-l-warning"
            : estado === "retiro" ? "border-l-muted-foreground"
            : "border-l-transparent";

          return (
            <div
              key={est.id}
              className={cn(
                "bg-card rounded-lg border border-l-4 p-3 transition-all",
                estadoBg
              )}
            >
              <div className="flex items-center gap-2.5">
                {/* Tap to open detail */}
                <button
                  className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                  onClick={() => setStudentDetailId(est.id)}
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {est.nombre[0]}{est.apellido[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate leading-tight">
                      {est.apellido}, {est.nombre}
                    </p>
                    <p className="text-[10px] text-muted-foreground">#{idx + 1}</p>
                  </div>
                </button>

                {/* Quick actions */}
                <div className="flex items-center gap-0.5 shrink-0">
                  {modoActivo === "asistencia" && (
                    <>
                      {([
                        { v: "presente", icon: Check, active: "bg-success text-success-foreground" },
                        { v: "falta", icon: X, active: "bg-destructive text-destructive-foreground" },
                        { v: "tarde", icon: Clock, active: "bg-warning text-warning-foreground" },
                        { v: "retiro", icon: LogOut, active: "bg-muted-foreground text-background" },
                      ] as const).map((btn) => (
                        <button
                          key={btn.v}
                          className={cn(
                            "h-11 w-11 rounded-xl flex items-center justify-center transition-all active:scale-95",
                            estado === btn.v ? btn.active : "bg-muted/50 text-muted-foreground hover:bg-muted"
                          )}
                          onClick={() => marcarAsistencia(est.id, btn.v)}
                        >
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
                      ]).map((opt) => (
                        <button
                          key={opt.v}
                          className={cn(
                            "h-11 w-11 rounded-xl flex items-center justify-center text-sm font-bold transition-all active:scale-95",
                            participacion[est.id] === opt.v ? opt.color : "bg-muted/50 text-muted-foreground hover:bg-muted"
                          )}
                          onClick={() => marcarParticipacion(est.id, opt.v)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </>
                  )}

                  {modoActivo === "notas" && evaluacionActiva && (
                    <Input
                      type="number"
                      inputMode="decimal"
                      placeholder="—"
                      className="w-16 h-11 text-center text-lg font-bold rounded-xl border-2 focus:border-primary"
                      value={notasState[`${evaluacionActiva}-${est.id}`] || ""}
                      onChange={(e) =>
                        setNotasState((prev) => ({
                          ...prev,
                          [`${evaluacionActiva}-${est.id}`]: e.target.value,
                        }))
                      }
                    />
                  )}

                  {modoActivo === "observaciones" && (
                    <button
                      className="h-9 w-9 rounded-lg flex items-center justify-center bg-muted/50 text-muted-foreground"
                      onClick={() => setStudentDetailId(est.id)}
                    >
                      <History className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Observation tags - shown inline */}
              {modoActivo === "observaciones" && (
                <div className="flex flex-wrap gap-1.5 mt-2 ml-[46px]">
                  {tagObservaciones.map((tag) => {
                    const isActive = (obsState[est.id] || []).includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        onClick={() => toggleObservacion(est.id, tag.id)}
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-medium border transition-all active:scale-95",
                          isActive ? tag.color : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/60"
                        )}
                      >
                        <tag.icon className="h-3.5 w-3.5" />
                        {tag.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Auto-save indicator */}
      {lastSaved && (
        <div className="fixed bottom-20 md:bottom-4 left-1/2 -translate-x-1/2 z-40">
          <div className="bg-success/90 text-success-foreground px-4 py-1.5 rounded-full text-xs font-medium shadow-lg flex items-center gap-1.5 backdrop-blur-sm">
            <Check className="h-3 w-3" />
            Guardado automáticamente
          </div>
        </div>
      )}

      <StudentDetailSheet
        studentId={studentDetailId}
        claseId={claseId || ""}
        open={!!studentDetailId}
        onClose={() => setStudentDetailId(null)}
      />
    </div>
  );
}
