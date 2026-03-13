import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Clock, LogOut, CheckCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { EstadoAsistencia } from "../types";

interface AsistenciaTabProps {
  estudiantes: any[];
  asistencia: Record<string, EstadoAsistencia>;
  motivos: Record<string, string>;
  stats: { total: number; presentes: number; faltas: number; tardes: number };
  isReadonly: boolean;
  onMarcarAsistencia: (estId: string, estado: EstadoAsistencia, motivo?: string) => void;
  onMarcarTodosPresentes: () => void;
  onStudentDetail: (estId: string) => void;
}

const getInitials = (name: string) => {
  const parts = name.split(" ");
  return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : name.substring(0, 2);
};

const asistButtons = [
  { v: "presente" as const, icon: Check, active: "bg-success text-success-foreground" },
  { v: "falta" as const, icon: X, active: "bg-destructive text-destructive-foreground" },
  { v: "tarde" as const, icon: Clock, active: "bg-warning text-warning-foreground" },
  { v: "retiro" as const, icon: LogOut, active: "bg-muted-foreground text-background" },
];

export function AsistenciaTab({
  estudiantes, asistencia, motivos, stats, isReadonly,
  onMarcarAsistencia, onMarcarTodosPresentes, onStudentDetail,
}: AsistenciaTabProps) {
  const [retiroDialog, setRetiroDialog] = useState<{ estId: string; nombre: string } | null>(null);
  const [retiroMotivo, setRetiroMotivo] = useState("");

  const handleButtonClick = (estId: string, estado: EstadoAsistencia, nombre: string) => {
    if (estado === "retiro" && asistencia[estId] !== "retiro") {
      // Opening retiro: show dialog
      setRetiroMotivo(motivos[estId] || "");
      setRetiroDialog({ estId, nombre });
    } else {
      onMarcarAsistencia(estId, estado);
    }
  };

  const confirmRetiro = () => {
    if (!retiroDialog) return;
    const { estId } = retiroDialog;
    const motivo = retiroMotivo.trim();
    setRetiroDialog(null);
    setRetiroMotivo("");
    requestAnimationFrame(() => {
      onMarcarAsistencia(estId, "retiro", motivo);
    });
  };

  return (
    <>
      <div className="flex items-center justify-between py-2 gap-2">
        <Button
          size="sm"
          className="gap-1.5 bg-success hover:bg-success/90 text-success-foreground h-10 text-sm font-semibold"
          onClick={onMarcarTodosPresentes}
          disabled={isReadonly}
        >
          <CheckCheck className="h-4 w-4" />Todos presentes
        </Button>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="text-success font-semibold">{stats.presentes}P</span>
          <span className="text-destructive font-semibold">{stats.faltas}F</span>
          <span className="text-warning font-semibold">{stats.tardes}T</span>
        </div>
      </div>
      <div className="space-y-1.5 mt-1">
        {estudiantes.map((est, idx) => {
          const estado = asistencia[est.id];
          const estadoBg = estado === "presente" ? "border-l-success" : estado === "falta" ? "border-l-destructive" : estado === "tarde" ? "border-l-warning" : estado === "retiro" ? "border-l-muted-foreground" : "border-l-transparent";
          const motivo = motivos[est.id];

          return (
            <div key={est.id} className={cn("bg-card rounded-lg border border-l-4 p-3 transition-colors", estadoBg)}>
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
                <div className="flex items-center gap-0.5 shrink-0">
                  {asistButtons.map(btn => (
                    <button
                      key={btn.v}
                      disabled={isReadonly}
                      className={cn(
                        "h-11 w-11 rounded-xl flex items-center justify-center transition-colors",
                        estado === btn.v ? `${btn.active}` : "bg-muted/50 text-muted-foreground hover:bg-muted",
                        isReadonly && "opacity-50 pointer-events-none"
                      )}
                      onClick={() => handleButtonClick(est.id, btn.v, est.nombre_completo)}
                    >
                      <btn.icon className="h-5 w-5" />
                    </button>
                  ))}
                </div>
              </div>
              {estado === "retiro" && motivo && (
                <p className="text-xs text-muted-foreground mt-1.5 ml-12 italic">Motivo: {motivo}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Retiro reason dialog */}
      <Dialog open={!!retiroDialog} onOpenChange={(open) => { if (!open) setRetiroDialog(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Motivo de retiro anticipado</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {retiroDialog?.nombre} — indicá el motivo del retiro:
          </p>
          <Textarea
            value={retiroMotivo}
            onChange={(e) => setRetiroMotivo(e.target.value)}
            placeholder="Ej: Se sintió mal, lo pasaron a buscar..."
            className="min-h-[80px]"
            maxLength={500}
            autoFocus
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRetiroDialog(null)}>Cancelar</Button>
            <Button onClick={confirmRetiro}>Confirmar retiro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
