import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CalendarCheck, Check } from "lucide-react";

interface DiarioTabProps {
  diarioTema: string;
  diarioActividad: string;
  diarioObs: string;
  temaPlanificado: string | null;
  diarioSugerencias: string[];
  isReadonly: boolean;
  onChange: (field: "tema" | "actividad" | "obs", value: string) => void;
}

export function DiarioTab({
  diarioTema, diarioActividad, diarioObs,
  temaPlanificado, diarioSugerencias, isReadonly, onChange,
}: DiarioTabProps) {
  const temaMatches = temaPlanificado && diarioTema.trim() === temaPlanificado.trim();

  return (
    <div className="space-y-4 py-3">
      {/* Tema sugerido prominente */}
      {temaPlanificado && (
        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
          <p className="text-[11px] font-semibold text-primary flex items-center gap-1.5 mb-1">
            <CalendarCheck className="h-3.5 w-3.5" /> Tema sugerido para hoy
          </p>
          <p className="text-sm font-bold text-foreground">{temaPlanificado}</p>
          {!temaMatches && !isReadonly && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2 gap-1.5 text-xs h-8 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground"
              onClick={() => onChange("tema", temaPlanificado)}
            >
              <Check className="h-3 w-3" /> Usar este tema
            </Button>
          )}
          {temaMatches && (
            <p className="text-[10px] text-success mt-1.5 font-medium flex items-center gap-1">
              <Check className="h-3 w-3" /> Tema aceptado
            </p>
          )}
        </div>
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
