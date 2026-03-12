import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CalendarCheck, Check, ArrowRight, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DiarioTabProps {
  diarioTema: string;
  diarioActividad: string;
  diarioObs: string;
  temaPlanificado: string | null;
  planEstado: string | null;
  diarioSugerencias: string[];
  isReadonly: boolean;
  planificacionStats: { completados: number; total: number };
  onChange: (field: "tema" | "actividad" | "obs", value: string) => void;
  onChangePlanEstado: (estado: string) => void;
  onNavigatePrograma: () => void;
}

const estadoOptions = [
  { value: "completado", label: "Completado", icon: CheckCircle2, color: "bg-success/10 text-success border-success/30 hover:bg-success/20" },
  { value: "parcial", label: "Parcial", icon: AlertTriangle, color: "bg-warning/10 text-warning border-warning/30 hover:bg-warning/20" },
  { value: "suspendido", label: "Suspendido", icon: XCircle, color: "bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20" },
];

export function DiarioTab({
  diarioTema, diarioActividad, diarioObs,
  temaPlanificado, planEstado, diarioSugerencias, isReadonly,
  planificacionStats, onChange, onChangePlanEstado, onNavigatePrograma,
}: DiarioTabProps) {
  const temaMatches = temaPlanificado && diarioTema.trim() === temaPlanificado.trim();
  const progressPercent = planificacionStats.total > 0
    ? Math.round((planificacionStats.completados / planificacionStats.total) * 100)
    : 0;

  return (
    <div className="space-y-4 py-3">
      {/* Tema sugerido prominente */}
      {temaPlanificado && (
        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 space-y-3">
          <div>
            <p className="text-[11px] font-semibold text-primary flex items-center gap-1.5 mb-1">
              <CalendarCheck className="h-3.5 w-3.5" /> Tema sugerido para hoy
            </p>
            <p className="text-sm font-bold text-foreground">{temaPlanificado}</p>
          </div>

          {!temaMatches && !isReadonly && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs h-8 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
              onClick={() => onChange("tema", temaPlanificado)}
            >
              <Check className="h-3 w-3" /> Usar este tema
            </Button>
          )}
          {temaMatches && (
            <p className="text-[10px] text-success font-medium flex items-center gap-1">
              <Check className="h-3 w-3" /> Tema aceptado
            </p>
          )}

          {/* Estado del tema planificado */}
          {!isReadonly && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-medium text-muted-foreground">Estado del tema:</p>
              <div className="flex flex-wrap gap-1.5">
                {estadoOptions.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => onChangePlanEstado(opt.value)}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                      planEstado === opt.value
                        ? opt.color + " border-current"
                        : "bg-muted/40 text-muted-foreground border-transparent hover:bg-muted"
                    )}
                  >
                    <opt.icon className="h-3 w-3" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Progreso del programa */}
      {planificacionStats.total > 0 && (
        <button
          onClick={onNavigatePrograma}
          className="w-full rounded-lg border bg-muted/30 p-3 text-left hover:bg-muted/50 transition-colors group"
        >
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[11px] font-medium text-muted-foreground">Progreso del programa</p>
            <span className="text-[10px] text-primary flex items-center gap-0.5 group-hover:underline">
              Ver programa <ArrowRight className="h-3 w-3" />
            </span>
          </div>
          <Progress value={progressPercent} className="h-2 mb-1" />
          <p className="text-[10px] text-muted-foreground">
            {planificacionStats.completados} de {planificacionStats.total} temas — {progressPercent}%
          </p>
        </button>
      )}

      {diarioSugerencias.length > 0 && (
        <div className="space-y-1">
          <p className="text-[11px] text-muted-foreground font-medium">Temas anteriores:</p>
          <div className="flex flex-wrap gap-1.5">
            {diarioSugerencias.map((tema, i) => (
              <button
                key={i}
                disabled={isReadonly}
                onClick={() => onChange("tema", tema)}
                className="px-2.5 py-1.5 rounded-lg bg-muted/60 text-xs text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors border border-transparent hover:border-primary/20"
              >
                {tema}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Tema trabajado</Label>
        <Input
          placeholder="Ej: Fracciones equivalentes"
          value={diarioTema}
          disabled={isReadonly}
          onChange={e => onChange("tema", e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Actividades realizadas</Label>
        <Textarea
          placeholder="Describe las actividades de la clase..."
          value={diarioActividad}
          disabled={isReadonly}
          onChange={e => onChange("actividad", e.target.value)}
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label>Observaciones generales</Label>
        <Textarea
          placeholder="Observaciones de la clase..."
          value={diarioObs}
          disabled={isReadonly}
          onChange={e => onChange("obs", e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );
}
