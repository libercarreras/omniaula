import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  ArrowLeft, Settings2, Loader2, CheckCircle2,
  UserCheck, ClipboardCheck, MessageSquare, BookOpen, LayoutDashboard, TrendingUp,
  CalendarIcon, Lock, FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { ModoActivo, TabBadges } from "./types";

interface ClaseHeaderProps {
  materiaName: string;
  grupoName: string;
  horario: string | null;
  aula: string | null;
  studentCount: number;
  modoActivo: ModoActivo;
  selectedDate: Date;
  isReadonly: boolean;
  isPastDate: boolean;
  saveStatus: string;
  tabBadges: TabBadges;
  onBack: () => void;
  onEditClase: () => void;
  onModoChange: (modo: ModoActivo) => void;
  onDateChange: (date: Date) => void;
}

const modos: { id: ModoActivo; label: string; icon: any }[] = [
  { id: "resumen", label: "Resumen", icon: LayoutDashboard },
  { id: "asistencia", label: "Asist.", icon: UserCheck },
  { id: "desempeno", label: "Desemp.", icon: TrendingUp },
  { id: "notas", label: "Notas", icon: ClipboardCheck },
  { id: "observaciones", label: "Obs.", icon: MessageSquare },
  { id: "diario", label: "Diario", icon: BookOpen },
  { id: "programa", label: "Prog.", icon: FileText },
];

export function ClaseHeader({
  materiaName, grupoName, horario, aula, studentCount,
  modoActivo, selectedDate, isReadonly, isPastDate,
  saveStatus, tabBadges, onBack, onEditClase, onModoChange, onDateChange,
}: ClaseHeaderProps) {
  const todayISO = new Date().toISOString().split("T")[0];
  const selectedISO = selectedDate.toISOString().split("T")[0];
  const isToday = selectedISO === todayISO;

  const getBadge = (modo: ModoActivo) => {
    if (modo === "resumen") return null;
    if (modo === "asistencia") {
      if (tabBadges.asistencia.complete) return <span className="h-1.5 w-1.5 rounded-full bg-success" />;
      if (tabBadges.asistencia.missing > 0) return <span className="text-[9px] font-bold text-warning">{tabBadges.asistencia.missing}</span>;
      return null;
    }
    if (modo === "desempeno") {
      if (tabBadges.desempeno.count > 0 && tabBadges.desempeno.count === tabBadges.desempeno.total) return <span className="h-1.5 w-1.5 rounded-full bg-success" />;
      if (tabBadges.desempeno.count > 0) return <span className="text-[9px] font-bold text-primary">{tabBadges.desempeno.count}</span>;
      return null;
    }
    if (modo === "notas") {
      if (tabBadges.notas.sinNota > 0) return <span className="text-[9px] font-bold text-warning">{tabBadges.notas.sinNota}</span>;
      return null;
    }
    if (modo === "observaciones") {
      if (tabBadges.observaciones.count > 0) return <span className="text-[9px] font-bold text-primary">{tabBadges.observaciones.count}</span>;
      return null;
    }
    if (modo === "diario") {
      if (tabBadges.diario.complete) return <span className="h-1.5 w-1.5 rounded-full bg-success" />;
      return null;
    }
    return null;
  };

  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b -mx-4 px-4 pt-1 pb-2 md:-mx-0 md:px-0">
      <div className="flex items-center gap-2 mb-2">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-display font-bold truncate">{materiaName} — {grupoName}</h1>
          <button onClick={onEditClase} className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
            <Settings2 className="h-3 w-3" />
            {horario || "Sin horario"}{aula ? ` · ${aula}` : ""}
          </button>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Save status */}
          {saveStatus !== "idle" && (
            <div className={cn(
              "flex items-center gap-1.5 text-xs font-medium transition-all animate-in fade-in",
              saveStatus === "saved" ? "text-success" : "text-muted-foreground"
            )}>
              {saveStatus === "pending" && <><span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" /> Pendiente</>}
              {saveStatus === "saving" && <><Loader2 className="h-3 w-3 animate-spin" /> Guardando...</>}
              {saveStatus === "saved" && <><CheckCircle2 className="h-3 w-3" /> Guardado ✓</>}
            </div>
          )}

          {/* Date selector */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant={isPastDate ? "outline" : "ghost"} size="sm" className={cn("h-7 gap-1 text-[10px] px-2", isPastDate && "border-warning text-warning")}>
                {isReadonly && <Lock className="h-3 w-3" />}
                <CalendarIcon className="h-3 w-3" />
                {isToday ? "Hoy" : format(selectedDate, "d MMM", { locale: es })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && onDateChange(d)}
                disabled={(date) => date > new Date()}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{studentCount}</Badge>
          {hasProgramaEstructura && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onShowPrograma}>
              <FileText className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Readonly banner */}
      {isReadonly && (
        <div className="flex items-center gap-2 px-3 py-1.5 mb-1.5 rounded-lg bg-warning/10 border border-warning/20 text-xs text-warning">
          <Lock className="h-3 w-3" /> Esta clase tiene más de 7 días y no puede editarse.
        </div>
      )}

      <div className="grid grid-cols-7 gap-1">
        {modos.map(modo => (
          <button
            key={modo.id}
            className={cn(
              "flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all relative",
              modoActivo === modo.id
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted/50 text-muted-foreground hover:bg-muted"
            )}
            onClick={() => onModoChange(modo.id)}
          >
            <modo.icon className="h-3.5 w-3.5" />
            {modo.label}
            {modoActivo !== modo.id && (
              <span className="absolute -top-0.5 -right-0.5">{getBadge(modo.id)}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
