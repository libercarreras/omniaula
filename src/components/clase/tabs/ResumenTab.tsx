import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCheck, ClipboardCheck, MessageSquare, BookOpen, CalendarCheck, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ModoActivo } from "../types";

interface ResumenTabProps {
  temaPlanificado: string | null;
  planEstado: string | null;
  asistenciaStats: { total: number; presentes: number; faltas: number; tardes: number };
  desempenoCount: number;
  desempenoTotal: number;
  obsStats: number;
  diarioTema: string;
  onNavigate: (modo: ModoActivo) => void;
}

const planEstadoLabel: Record<string, { label: string; color: string }> = {
  pendiente: { label: "Pendiente", color: "bg-muted text-muted-foreground" },
  completado: { label: "Completado", color: "bg-success/10 text-success" },
  parcial: { label: "Parcial", color: "bg-warning/10 text-warning" },
  suspendido: { label: "Suspendido", color: "bg-destructive/10 text-destructive" },
  reprogramado: { label: "Reprogramado", color: "bg-primary/10 text-primary" },
};

export function ResumenTab({
  temaPlanificado, planEstado, asistenciaStats, desempenoCount, desempenoTotal,
  evaluacionesCount, obsStats, diarioTema, onNavigate,
}: ResumenTabProps) {
  return (
    <div className="space-y-3 py-3">
      {temaPlanificado && (
        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1"><CalendarCheck className="h-3 w-3" /> Tema planificado para hoy</p>
                <p className="text-sm font-semibold mt-0.5 truncate">{temaPlanificado}</p>
              </div>
              {planEstado && planEstadoLabel[planEstado] && (
                <Badge className={cn("text-[10px] shrink-0", planEstadoLabel[planEstado].color)}>{planEstadoLabel[planEstado].label}</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-3">
          <button className="w-full text-left" onClick={() => onNavigate("asistencia")}>
            <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1"><UserCheck className="h-3 w-3" /> Asistencia</p>
            <div className="flex items-center gap-4 mt-1.5">
              <span className="text-lg font-bold text-success">{asistenciaStats.presentes}<span className="text-xs font-normal text-muted-foreground ml-0.5">P</span></span>
              <span className="text-lg font-bold text-destructive">{asistenciaStats.faltas}<span className="text-xs font-normal text-muted-foreground ml-0.5">F</span></span>
              <span className="text-lg font-bold text-warning">{asistenciaStats.tardes}<span className="text-xs font-normal text-muted-foreground ml-0.5">T</span></span>
              <span className="text-xs text-muted-foreground ml-auto">de {asistenciaStats.total}</span>
            </div>
          </button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3">
          <button className="w-full text-left" onClick={() => onNavigate("desempeno")}>
            <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Desempeño diario</p>
            <p className="text-sm font-semibold mt-1">{desempenoCount} de {desempenoTotal} evaluados</p>
          </button>
        </CardContent>
      </Card>

      {evaluacionesCount > 0 && (
        <Card>
          <CardContent className="p-3">
            <button className="w-full text-left" onClick={() => onNavigate("notas")}>
              <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1"><ClipboardCheck className="h-3 w-3" /> Evaluaciones</p>
              <p className="text-sm mt-1">{evaluacionesCount} evaluación{evaluacionesCount > 1 ? "es" : ""} configurada{evaluacionesCount > 1 ? "s" : ""}</p>
            </button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-3">
          <button className="w-full text-left" onClick={() => onNavigate("observaciones")}>
            <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Observaciones hoy</p>
            <p className="text-sm font-semibold mt-1">{obsStats} registrada{obsStats !== 1 ? "s" : ""}</p>
          </button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3">
          <button className="w-full text-left" onClick={() => onNavigate("diario")}>
            <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1"><BookOpen className="h-3 w-3" /> Diario de clase</p>
            {diarioTema ? (
              <p className="text-sm mt-1 truncate"><span className="font-medium">Tema:</span> {diarioTema}</p>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">Sin completar</p>
            )}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
