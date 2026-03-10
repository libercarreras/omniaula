import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { History } from "lucide-react";
import { cn } from "@/lib/utils";
import { tagObservaciones } from "../types";

interface ObservacionesTabProps {
  estudiantes: any[];
  obsState: Record<string, string[]>;
  obsStats: number;
  isReadonly: boolean;
  onToggleObservacion: (estId: string, obsId: string) => void;
  onStudentDetail: (estId: string) => void;
}

const getInitials = (name: string) => {
  const parts = name.split(" ");
  return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : name.substring(0, 2);
};

export function ObservacionesTab({
  estudiantes, obsState, obsStats, isReadonly,
  onToggleObservacion, onStudentDetail,
}: ObservacionesTabProps) {
  return (
    <>
      <div className="flex items-center justify-between py-2">
        <span className="text-xs text-muted-foreground">{obsStats} observaciones registradas hoy</span>
      </div>
      <div className="space-y-1.5 mt-1">
        {estudiantes.map((est, idx) => (
          <div key={est.id} className="bg-card rounded-lg border border-l-4 border-l-transparent p-3 transition-all">
            <div className="flex items-center gap-2.5">
              <button className="flex items-center gap-2.5 min-w-0 flex-1 text-left" onClick={() => onStudentDetail(est.id)}>
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{getInitials(est.nombre_completo)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate leading-tight">{est.nombre_completo}</p>
                  <p className="text-[10px] text-muted-foreground">#{idx + 1}</p>
                </div>
              </button>
              <button className="h-9 w-9 rounded-lg flex items-center justify-center bg-muted/50 text-muted-foreground" onClick={() => onStudentDetail(est.id)}>
                <History className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2 ml-[46px]">
              {tagObservaciones.map(tag => {
                const isActive = (obsState[est.id] || []).includes(tag.tipo);
                return (
                  <button
                    key={tag.id}
                    disabled={isReadonly}
                    onClick={() => onToggleObservacion(est.id, tag.tipo)}
                    className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-medium border transition-all active:scale-95",
                      isActive ? `${tag.color} animate-in zoom-in-95 duration-150` : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/60",
                      isReadonly && "opacity-50 pointer-events-none"
                    )}
                  >
                    <tag.icon className="h-3.5 w-3.5" />{tag.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
