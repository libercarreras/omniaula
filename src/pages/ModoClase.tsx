import { useParams, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ArrowLeft, UserCheck, ClipboardCheck, MessageSquare, FileText,
  Check, X, Clock, LogOut, CheckCheck, Star, Minus, ChevronDown,
  ThumbsUp, AlertCircle, BookX, Brain, History,
} from "lucide-react";
import {
  clases, estudiantes, getClaseLabel, getClase, evaluaciones,
  grupos, materias, observaciones,
} from "@/data/mockData";
import { cn } from "@/lib/utils";
import { StudentDetailSheet } from "@/components/clase/StudentDetailSheet";

type ModoActivo = "asistencia" | "notas" | "observaciones" | "participacion" | null;
type EstadoAsistencia = "presente" | "falta" | "tarde" | "retiro" | null;
type NivelParticipacion = "alta" | "media" | "baja";

const tagObservaciones = [
  { id: "buen_desempeno", label: "Buen desempeño", icon: ThumbsUp, color: "bg-success/10 text-success border-success/30" },
  { id: "necesita_apoyo", label: "Necesita apoyo", icon: AlertCircle, color: "bg-warning/10 text-warning border-warning/30" },
  { id: "no_entrega_tareas", label: "No entrega tareas", icon: BookX, color: "bg-destructive/10 text-destructive border-destructive/30" },
  { id: "dificultad_contenidos", label: "Dificultad en contenidos", icon: Brain, color: "bg-primary/10 text-primary border-primary/30" },
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

  const clase = getClase(claseId || "");
  const grupo = clase ? grupos.find((g) => g.id === clase.grupoId) : null;
  const materia = clase ? materias.find((m) => m.id === clase.materiaId) : null;
  const estudiantesClase = estudiantes.filter((e) => e.grupoId === clase?.grupoId);
  const evaluacionesClase = evaluaciones.filter((ev) => ev.claseId === claseId);

  const hoy = new Date().toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const asistenciaStats = useMemo(() => {
    const total = estudiantesClase.length;
    const marcados = Object.values(asistencia).filter(Boolean).length;
    const presentes = Object.values(asistencia).filter((v) => v === "presente").length;
    return { total, marcados, presentes };
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
    toast.success("Todos marcados como presentes");
  };

  const marcarParticipacion = (estId: string, nivel: NivelParticipacion) => {
    setParticipacion((prev) => ({
      ...prev,
      [estId]: prev[estId] === nivel ? null : nivel,
    }));
    toast.success("Participación registrada");
  };

  const toggleObservacion = (estId: string, obsId: string) => {
    setObsState((prev) => {
      const current = prev[estId] || [];
      const next = current.includes(obsId)
        ? current.filter((id) => id !== obsId)
        : [...current, obsId];
      return { ...prev, [estId]: next };
    });
    toast.success("Observación registrada");
  };

  const modos = [
    { id: "asistencia" as const, label: "Asistencia", icon: UserCheck },
    { id: "notas" as const, label: "Notas", icon: ClipboardCheck },
    { id: "observaciones" as const, label: "Observaciones", icon: MessageSquare },
    { id: "participacion" as const, label: "Participación", icon: Star },
  ];

  return (
    <div className="max-w-4xl mx-auto pb-24 md:pb-6">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b pb-3 -mx-4 px-4 pt-1 md:-mx-0 md:px-0 md:pt-0">
        <div className="flex items-center gap-3 mb-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-display font-bold truncate">
              {materia.nombre} — {grupo.nombre}
            </h1>
            <p className="text-xs text-muted-foreground capitalize">{hoy}</p>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {estudiantesClase.length} est.
          </Badge>
        </div>

        {/* Mode buttons */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {modos.map((modo) => (
            <Button
              key={modo.id}
              size="sm"
              variant={modoActivo === modo.id ? "default" : "outline"}
              className={cn(
                "gap-1.5 shrink-0 h-9",
                modoActivo === modo.id && "shadow-md"
              )}
              onClick={() => setModoActivo(modo.id)}
            >
              <modo.icon className="h-4 w-4" />
              <span className="text-xs">{modo.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Mode-specific toolbar */}
      {modoActivo === "asistencia" && (
        <div className="flex items-center justify-between py-3 gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 bg-success/10 border-success/30 text-success hover:bg-success/20"
            onClick={marcarTodosPresentes}
          >
            <CheckCheck className="h-4 w-4" />
            Todos presentes
          </Button>
          <span className="text-xs text-muted-foreground">
            {asistenciaStats.marcados}/{asistenciaStats.total} marcados
          </span>
        </div>
      )}

      {modoActivo === "notas" && (
        <div className="py-3">
          {evaluacionesClase.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {evaluacionesClase.map((ev) => (
                <Button
                  key={ev.id}
                  size="sm"
                  variant={evaluacionActiva === ev.id ? "default" : "outline"}
                  className="shrink-0"
                  onClick={() => setEvaluacionActiva(ev.id)}
                >
                  {ev.titulo}
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No hay evaluaciones para esta clase</p>
          )}
        </div>
      )}

      {/* Student list */}
      <div className="space-y-2 mt-2">
        {estudiantesClase.map((est) => (
          <Card key={est.id} className="overflow-hidden">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                {/* Avatar + name */}
                <button
                  className="flex items-center gap-3 min-w-0 flex-1 text-left"
                  onClick={() => setStudentDetailId(est.id)}
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {est.nombre[0]}{est.apellido[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      {est.apellido}, {est.nombre}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      #{estudiantes.indexOf(est) + 1}
                    </p>
                  </div>
                </button>

                {/* Contextual actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {modoActivo === "asistencia" && (
                    <AttendanceButtons
                      estado={asistencia[est.id] || null}
                      onChange={(estado) => marcarAsistencia(est.id, estado)}
                    />
                  )}

                  {modoActivo === "participacion" && (
                    <ParticipationButtons
                      nivel={participacion[est.id] || null}
                      onChange={(nivel) => marcarParticipacion(est.id, nivel)}
                    />
                  )}

                  {modoActivo === "notas" && evaluacionActiva && (
                    <Input
                      type="number"
                      placeholder="—"
                      className="w-16 h-10 text-center text-lg font-semibold"
                      value={notasState[`${evaluacionActiva}-${est.id}`] || ""}
                      onChange={(e) =>
                        setNotasState((prev) => ({
                          ...prev,
                          [`${evaluacionActiva}-${est.id}`]: e.target.value,
                        }))
                      }
                    />
                  )}

                  {modoActivo === null && (
                    <Button variant="ghost" size="icon" onClick={() => setStudentDetailId(est.id)}>
                      <History className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Observation tags */}
              {modoActivo === "observaciones" && (
                <div className="flex flex-wrap gap-1.5 mt-2 pl-13">
                  {tagObservaciones.map((tag) => {
                    const isActive = (obsState[est.id] || []).includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        onClick={() => toggleObservacion(est.id, tag.id)}
                        className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium border transition-all",
                          isActive ? tag.color : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                        )}
                      >
                        <tag.icon className="h-3 w-3" />
                        {tag.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Save floating button */}
      <div className="fixed bottom-20 md:bottom-6 left-0 right-0 flex justify-center z-40 px-4">
        <Button
          size="lg"
          className="shadow-lg gap-2 w-full max-w-sm"
          onClick={() => toast.success("Datos guardados correctamente")}
        >
          <Check className="h-4 w-4" />
          Guardar {modoActivo || "cambios"}
        </Button>
      </div>

      {/* Student detail sheet */}
      <StudentDetailSheet
        studentId={studentDetailId}
        claseId={claseId || ""}
        open={!!studentDetailId}
        onClose={() => setStudentDetailId(null)}
      />
    </div>
  );
}

/* ---- Sub-components ---- */

function AttendanceButtons({
  estado,
  onChange,
}: {
  estado: EstadoAsistencia;
  onChange: (e: EstadoAsistencia) => void;
}) {
  const buttons = [
    { value: "presente" as const, icon: Check, activeClass: "bg-success text-success-foreground" },
    { value: "falta" as const, icon: X, activeClass: "bg-destructive text-destructive-foreground" },
    { value: "tarde" as const, icon: Clock, activeClass: "bg-warning text-warning-foreground" },
    { value: "retiro" as const, icon: LogOut, activeClass: "bg-muted-foreground text-background" },
  ];

  return (
    <div className="flex gap-1">
      {buttons.map((btn) => (
        <Button
          key={btn.value}
          size="icon"
          variant="outline"
          className={cn(
            "h-9 w-9 transition-all",
            estado === btn.value && btn.activeClass
          )}
          onClick={() => onChange(btn.value)}
        >
          <btn.icon className="h-4 w-4" />
        </Button>
      ))}
    </div>
  );
}

function ParticipationButtons({
  nivel,
  onChange,
}: {
  nivel: NivelParticipacion | null;
  onChange: (n: NivelParticipacion) => void;
}) {
  const options = [
    { value: "alta" as const, label: "Alta", color: "bg-success text-success-foreground" },
    { value: "media" as const, label: "Media", color: "bg-warning text-warning-foreground" },
    { value: "baja" as const, label: "Baja", color: "bg-destructive text-destructive-foreground" },
  ];

  return (
    <div className="flex gap-1">
      {options.map((opt) => (
        <Button
          key={opt.value}
          size="sm"
          variant="outline"
          className={cn(
            "h-9 text-xs px-2.5 transition-all",
            nivel === opt.value && opt.color
          )}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );
}
