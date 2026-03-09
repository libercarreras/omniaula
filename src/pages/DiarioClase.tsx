import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Sparkles, Loader2 } from "lucide-react";
import { diarioClase, getClaseLabel, clases } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function DiarioClase() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tema, setTema] = useState("");
  const [actividad, setActividad] = useState("");
  const [participacion, setParticipacion] = useState("moderada");
  const [claseId, setClaseId] = useState(clases[0]?.id || "");
  const [resumen, setResumen] = useState("");
  const [generating, setGenerating] = useState(false);

  const generarResumen = async () => {
    if (!tema.trim() || !actividad.trim()) {
      toast.error("Completa el tema y la actividad");
      return;
    }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-diary-summary", {
        body: {
          tema,
          actividad,
          participacion,
          claseLabel: getClaseLabel(claseId),
        },
      });
      if (error) throw error;
      setResumen(data?.summary || "");
      toast.success("Resumen generado con IA");
    } catch {
      // Fallback local
      setResumen(
        `Durante la clase se trabajó el tema "${tema}" mediante ${actividad.toLowerCase()}. ` +
        `La participación del grupo fue ${participacion}. `
      );
      toast.info("Resumen generado localmente (IA no disponible)");
    } finally {
      setGenerating(false);
    }
  };

  const guardarEntrada = () => {
    toast.success("Entrada guardada en el diario");
    setDialogOpen(false);
    setTema("");
    setActividad("");
    setResumen("");
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Diario de Clase</h1>
        <Button size="lg" className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Nueva entrada
        </Button>
      </div>
      <div className="space-y-3">
        {diarioClase.map((entry) => (
          <Card key={entry.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold">{getClaseLabel(entry.claseId)}</p>
                <span className="text-sm text-muted-foreground">{entry.fecha}</span>
              </div>
              <p className="text-sm mb-2">{entry.descripcion}</p>
              <div className="flex gap-2 flex-wrap">
                {entry.temas.map((t) => (
                  <Badge key={t} variant="secondary">{t}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog nueva entrada */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva entrada del diario</DialogTitle>
            <DialogDescription>
              Registra lo trabajado en la clase. Puedes generar un resumen con IA.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Clase</Label>
              <Select value={claseId} onValueChange={setClaseId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {clases.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{getClaseLabel(c.id)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tema trabajado</Label>
              <Input
                placeholder="Ej: Ecuaciones cuadráticas"
                value={tema}
                onChange={(e) => setTema(e.target.value)}
              />
            </div>
            <div>
              <Label>Actividad realizada</Label>
              <Input
                placeholder="Ej: Ejercicios prácticos en grupo"
                value={actividad}
                onChange={(e) => setActividad(e.target.value)}
              />
            </div>
            <div>
              <Label>Nivel de participación</Label>
              <Select value={participacion} onValueChange={setParticipacion}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="moderada">Moderada</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={generarResumen}
              disabled={generating}
            >
              {generating ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Generando...</>
              ) : (
                <><Sparkles className="h-4 w-4" /> Generar resumen con IA</>
              )}
            </Button>

            {resumen && (
              <div>
                <Label>Resumen (editable)</Label>
                <Textarea
                  value={resumen}
                  onChange={(e) => setResumen(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={guardarEntrada} disabled={!tema.trim()}>
              Guardar entrada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
