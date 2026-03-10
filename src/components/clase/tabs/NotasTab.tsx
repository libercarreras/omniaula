import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NotasTabProps {
  estudiantes: any[];
  evaluaciones: any[];
  evaluacionActiva: string | null;
  notasState: Record<string, string>;
  isReadonly: boolean;
  onEvaluacionChange: (id: string) => void;
  onNotaChange: (key: string, value: string) => void;
  onStudentDetail: (estId: string) => void;
}

const getInitials = (name: string) => {
  const parts = name.split(" ");
  return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : name.substring(0, 2);
};

export function NotasTab({
  estudiantes, evaluaciones, evaluacionActiva, notasState, isReadonly,
  onEvaluacionChange, onNotaChange, onStudentDetail,
}: NotasTabProps) {
  const notasStats = (() => {
    if (!evaluacionActiva) return null;
    const vals = Object.entries(notasState)
      .filter(([k, v]) => k.startsWith(evaluacionActiva) && v.trim() !== "")
      .map(([, v]) => parseFloat(v))
      .filter(n => !isNaN(n));
    if (vals.length === 0) return null;
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return { count: vals.length, avg: avg.toFixed(1) };
  })();

  return (
    <>
      <div className="py-2 space-y-2">
        {evaluaciones.length > 0 ? (
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {evaluaciones.map(ev => (
              <button
                key={ev.id}
                className={cn(
                  "shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                  evaluacionActiva === ev.id ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground"
                )}
                onClick={() => onEvaluacionChange(ev.id)}
              >
                {ev.nombre}
              </button>
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
      {evaluacionActiva && (
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
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="—"
                  disabled={isReadonly}
                  className="w-16 h-11 text-center text-lg font-bold rounded-xl border-2 focus:border-primary"
                  value={notasState[`${evaluacionActiva}-${est.id}`] || ""}
                  onChange={e => onNotaChange(`${evaluacionActiva}-${est.id}`, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
