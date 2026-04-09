import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const DIAS_SEMANA = [
  { key: "Lun", label: "Lun" }, { key: "Mar", label: "Mar" }, { key: "Mié", label: "Mié" },
  { key: "Jue", label: "Jue" }, { key: "Vie", label: "Vie" }, { key: "Sáb", label: "Sáb" },
];

export const HORA_OPTIONS = (() => {
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
  if (rangeMatch) return { dias: diasFound, horaInicio: rangeMatch[1], horaFin: rangeMatch[2] };
  const singleMatch = horario.match(/(\d{1,2}:\d{2})/);
  return { dias: diasFound, horaInicio: singleMatch ? singleMatch[1] : "", horaFin: "" };
};

export const buildHorarioString = (dias: string[], horaInicio: string, horaFin: string) => {
  if (dias.length === 0) return null;
  const ordered = DIAS_SEMANA.filter(d => dias.includes(d.key)).map(d => d.key);
  const horaPart = horaInicio && horaFin ? `${horaInicio}-${horaFin}` : horaInicio || "";
  return `${ordered.join("/")}${horaPart ? " " + horaPart : ""}`;
};

interface Props {
  open: boolean;
  horario: string | null;
  aula: string | null;
  claseId: string;
  onClose: () => void;
  onSaved: (patch: { horario: string | null; aula: string | null }) => void;
}

export function EditClaseDialog({ open, horario, aula, claseId, onClose, onSaved }: Props) {
  const parsed = parseHorarioToState(horario);
  const [dias, setDias] = useState<string[]>(parsed.dias);
  const [horaInicio, setHoraInicio] = useState(parsed.horaInicio);
  const [horaFin, setHoraFin] = useState(parsed.horaFin);
  const [aulaEdit, setAulaEdit] = useState(aula || "");
  const [saving, setSaving] = useState(false);

  // Re-sync state when dialog opens with fresh props
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      const p = parseHorarioToState(horario);
      setDias(p.dias);
      setHoraInicio(p.horaInicio);
      setHoraFin(p.horaFin);
      setAulaEdit(aula || "");
    } else {
      onClose();
    }
  };

  const save = async () => {
    setSaving(true);
    const newHorario = buildHorarioString(dias, horaInicio, horaFin);
    const { error } = await supabase.from("clases").update({
      horario: newHorario, aula: aulaEdit.trim() || null,
    }).eq("id", claseId);
    setSaving(false);
    if (error) { toast.error("Error al guardar"); return; }
    onSaved({ horario: newHorario, aula: aulaEdit.trim() || null });
    onClose();
    toast.success("Clase actualizada");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>Editar clase</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Días de clase</Label>
            <div className="flex flex-wrap gap-2">
              {DIAS_SEMANA.map(dia => (
                <button key={dia.key} type="button"
                  onClick={() => setDias(prev => prev.includes(dia.key) ? prev.filter(d => d !== dia.key) : [...prev, dia.key])}
                  className={cn("px-3 py-2 rounded-lg text-sm font-medium border transition-all active:scale-95",
                    dias.includes(dia.key) ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-transparent hover:bg-muted"
                  )}>
                  {dia.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Horario (opcional)</Label>
            <div className="flex items-center gap-2">
              <Select value={horaInicio} onValueChange={setHoraInicio}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Inicio" /></SelectTrigger>
                <SelectContent>
                  {HORA_OPTIONS.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                </SelectContent>
              </Select>
              <span className="text-muted-foreground">—</span>
              <Select value={horaFin} onValueChange={setHoraFin}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Fin" /></SelectTrigger>
                <SelectContent>
                  {HORA_OPTIONS.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-aula">Aula</Label>
            <Input id="edit-aula" placeholder="Ej: Aula 12" value={aulaEdit} onChange={e => setAulaEdit(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
