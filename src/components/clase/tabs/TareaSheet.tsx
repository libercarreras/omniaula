import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ClipboardList, Save, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TareaSheetProps {
  open: boolean;
  onClose: () => void;
  claseId: string;
  userId: string;
  fecha: string;
  isReadonly: boolean;
  onTareaChange: (hasTarea: boolean) => void;
}

interface TareaData {
  id: string;
  titulo: string;
  descripcion: string | null;
  fecha_entrega: string | null;
}

export function TareaSheet({ open, onClose, claseId, userId, fecha, isReadonly, onTareaChange }: TareaSheetProps) {
  const [tareas, setTareas] = useState<TareaData[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState("");

  useEffect(() => {
    if (!open) return;
    loadTareas();
  }, [open, claseId, fecha]);

  const loadTareas = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("tareas")
      .select("id, titulo, descripcion, fecha_entrega")
      .eq("clase_id", claseId)
      .eq("created_at::date" as any, fecha)
      .order("created_at", { ascending: false });
    
    // Fallback: filter by created_at date since ::date cast may not work via client
    // Use a range filter instead
    const startOfDay = `${fecha}T00:00:00.000Z`;
    const endOfDay = `${fecha}T23:59:59.999Z`;
    const { data: tareasData } = await supabase
      .from("tareas")
      .select("id, titulo, descripcion, fecha_entrega")
      .eq("clase_id", claseId)
      .gte("created_at", startOfDay)
      .lte("created_at", endOfDay)
      .order("created_at", { ascending: false });

    setTareas(tareasData || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!titulo.trim()) {
      toast.error("Ingresa un título para la tarea");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.from("tareas").insert({
      clase_id: claseId,
      user_id: userId,
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || null,
      fecha_entrega: fechaEntrega || null,
    }).select("id, titulo, descripcion, fecha_entrega").maybeSingle();

    if (error) {
      toast.error("Error al guardar la tarea");
    } else if (data) {
      setTareas(prev => [data, ...prev]);
      setTitulo("");
      setDescripcion("");
      setFechaEntrega("");
      onTareaChange(true);
      toast.success("Tarea registrada");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("tareas").delete().eq("id", id);
    setTareas(prev => {
      const next = prev.filter(t => t.id !== id);
      onTareaChange(next.length > 0);
      return next;
    });
    toast.success("Tarea eliminada");
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="max-h-[85vh] rounded-t-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Tareas del día — {new Date(fecha + "T12:00:00").toLocaleDateString("es", { day: "numeric", month: "short" })}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 py-4 overflow-y-auto max-h-[60vh]">
          {/* Form to add new task */}
          {!isReadonly && (
            <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Título de la tarea</Label>
                <Input
                  placeholder="Ej: Ejercicios pág. 45"
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Descripción (opcional)</Label>
                <Textarea
                  placeholder="Detalles de la tarea..."
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Fecha de entrega (opcional)</Label>
                <Input
                  type="date"
                  value={fechaEntrega}
                  onChange={e => setFechaEntrega(e.target.value)}
                  className="h-9 w-auto"
                />
              </div>
              <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Agregar tarea
              </Button>
            </div>
          )}

          {/* Existing tasks */}
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : tareas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No se asignaron tareas este día.
            </p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                {tareas.length} tarea{tareas.length !== 1 ? "s" : ""} asignada{tareas.length !== 1 ? "s" : ""}
              </p>
              {tareas.map(t => (
                <div key={t.id} className="rounded-lg border bg-card p-3 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{t.titulo}</p>
                      {t.descripcion && (
                        <p className="text-xs text-muted-foreground mt-0.5">{t.descripcion}</p>
                      )}
                      {t.fecha_entrega && (
                        <p className="text-[10px] text-primary mt-1">
                          Entrega: {new Date(t.fecha_entrega + "T12:00:00").toLocaleDateString("es", { day: "numeric", month: "short" })}
                        </p>
                      )}
                    </div>
                    {!isReadonly && (
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
