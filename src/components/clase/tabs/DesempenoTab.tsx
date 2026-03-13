import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { ClipboardList, MessageCircle, BarChart3, Handshake } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NivelDesempeno } from "../types";

export type DesempenoCategoria = "tarea" | "participacion_oral" | "rendimiento_aula" | "conducta";

export interface DesempenoRecord {
  tarea: NivelDesempeno;
  participacion_oral: NivelDesempeno;
  rendimiento_aula: NivelDesempeno;
  conducta: NivelDesempeno;
}

interface DesempenoTabProps {
  estudiantes: any[];
  desempeno: Record<string, DesempenoRecord>;
  isReadonly: boolean;
  hasTareaHoy?: boolean;
  onCambiarDesempeno: (estId: string, categoria: DesempenoCategoria, nivel: NivelDesempeno) => void;
  onMarcarTodosA: () => void;
  onStudentDetail: (estId: string) => void;
  onTareaHeaderClick?: () => void;
}

const categorias: { key: DesempenoCategoria; label: string; shortLabel: string; icon: any }[] = [
  { key: "tarea", label: "Tarea Domiciliaria", shortLabel: "Tarea", icon: ClipboardList },
  { key: "participacion_oral", label: "Participación Oral", shortLabel: "Oral", icon: MessageCircle },
  { key: "rendimiento_aula", label: "Rendimiento en Aula", shortLabel: "Rend.", icon: BarChart3 },
  { key: "conducta", label: "Conducta", shortLabel: "Cond.", icon: Handshake },
];

const niveles: NivelDesempeno[] = [null, "B", "M", "A", "A+"];

const nivelConfig: Record<string, { color: string; bg: string }> = {
  B: { color: "text-destructive-foreground", bg: "bg-destructive" },
  M: { color: "text-warning-foreground", bg: "bg-warning" },
  A: { color: "text-success-foreground", bg: "bg-success" },
  "A+": { color: "text-primary-foreground", bg: "bg-primary" },
};

const getInitials = (name: string) => {
  const parts = name.split(" ");
  return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : name.substring(0, 2);
};

const cycleNivel = (current: NivelDesempeno): NivelDesempeno => {
  const idx = niveles.indexOf(current);
  return niveles[(idx + 1) % niveles.length];
};

import { memo } from "react";

export const DesempenoTab = memo(function DesempenoTab({
  estudiantes, desempeno, isReadonly, hasTareaHoy,
  onCambiarDesempeno, onMarcarTodosA, onStudentDetail, onTareaHeaderClick,
}: DesempenoTabProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="py-2 space-y-3">

        {/* Header row — tooltips only here (4 instances, safe) */}
        <div className="grid grid-cols-[1fr_repeat(4,3rem)] gap-1 items-center px-1">
          <span className="text-[10px] text-muted-foreground font-medium">Alumno</span>
          {categorias.map(cat => (
            <Tooltip key={cat.key}>
              <TooltipTrigger asChild>
                <button
                  className={cn(
                    "flex flex-col items-center gap-0.5 cursor-pointer relative",
                    cat.key === "tarea" && onTareaHeaderClick && "hover:text-primary transition-colors"
                  )}
                  onClick={() => cat.key === "tarea" && onTareaHeaderClick?.()}
                >
                  <cat.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[9px] text-muted-foreground font-medium leading-none">{cat.shortLabel}</span>
                  {cat.key === "tarea" && hasTareaHoy && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">
                  {cat.label}
                  {cat.key === "tarea" && onTareaHeaderClick ? " — toca para describir" : ""}
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>

        {/* Student rows — NO tooltips on cells to avoid Android crash */}
        <div className="space-y-1">
          {estudiantes.map((est) => {
            const record = desempeno[est.id] || { tarea: null, participacion_oral: null, rendimiento_aula: null, conducta: null };
            return (
              <div key={est.id} className="grid grid-cols-[1fr_repeat(4,3rem)] gap-1 items-center bg-card rounded-lg border p-2">
                <button
                  className="flex items-center gap-2 min-w-0 text-left"
                  onClick={() => onStudentDetail(est.id)}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                      {getInitials(est.nombre_completo)}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-medium text-sm truncate leading-tight">{est.nombre_completo}</p>
                </button>
                {categorias.map(cat => {
                  const val = record[cat.key];
                  const config = val ? nivelConfig[val] : null;
                  return (
                    <button
                      key={cat.key}
                      disabled={isReadonly}
                      aria-label={`${cat.label}: ${val || "Sin evaluar"}`}
                      // @ts-ignore - needed for Android autocorrect prevention
                      autoComplete="off"
                      // @ts-ignore
                      autoCorrect="off"
                      spellCheck={false}
                      data-form-type="other"
                      className={cn(
                        "h-10 w-12 rounded-lg flex items-center justify-center text-xs font-bold transition-colors",
                        config ? `${config.bg} ${config.color}` : "bg-muted/40 text-muted-foreground/40",
                        isReadonly && "opacity-50 pointer-events-none"
                      )}
                      onClick={() => onCambiarDesempeno(est.id, cat.key, cycleNivel(val))}
                    >
                      <span translate="no">{val || "—"}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
});
