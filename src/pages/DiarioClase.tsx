import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Sparkles, Loader2, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useInstitucion } from "@/hooks/useInstitucion";
import { toast } from "sonner";

export default function DiarioClase() {
  const { user } = useAuth();
  const { institucionActiva } = useInstitucion();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<any[]>([]);
  const [clases, setClases] = useState<any[]>([]);
  const [materias, setMaterias] = useState<Record<string, string>>({});
  const [grupos, setGrupos] = useState<Record<string, string>>({});

  const [dialogOpen, setDialogOpen] = useState(false);
  const [tema, setTema] = useState("");
  const [actividad, setActividad] = useState("");
  const [participacion, setParticipacion] = useState("moderada");
  const [claseId, setClaseId] = useState("");
  const [resumen, setResumen] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!user || !institucionActiva) return;
    const fetch = async () => {
      setLoading(true);
      const { data: grpData } = await supabase.from("grupos").select("id, nombre").eq("institucion_id", institucionActiva.id);
      const grupoIds = (grpData || []).map(g => g.id);
      const gm: Record<string, string> = {};
      (grpData || []).forEach(g => { gm[g.id] = g.nombre; });
      setGrupos(gm);

      if (grupoIds.length === 0) { setClases([]); setEntries([]); setLoading(false); return; }

      const [clsRes, matRes, diarioRes] = await Promise.all([
        supabase.from("clases").select("*").in("grupo_id", grupoIds),
        supabase.from("materias").select("id, nombre"),
        supabase.from("diario_clase").select("*").order("fecha", { ascending: false }),
      ]);
      const clsData = clsRes.data || [];
      setClases(clsData);
      const mm: Record<string, string> = {};
      (matRes.data || []).forEach(m => { mm[m.id] = m.nombre; });
      setMaterias(mm);
      const claseIds = new Set(clsData.map(c => c.id));
      setEntries((diarioRes.data || []).filter(e => claseIds.has(e.clase_id)));
      if (clsData.length > 0) setClaseId(clsData[0].id);
      setLoading(false);
    };
    fetch();
  }, [user, institucionActiva]);

  const getClaseLabel = (id: string) => {
    const c = clases.find(cl => cl.id === id);
    if (!c) return "?";
    return `${materias[c.materia_id] || "?"} - ${grupos[c.grupo_id] || "?"}`;
  };

  const generarResumen = async () => {
    if (!tema.trim() || !actividad.trim()) { toast.error("Completa el tema y la actividad"); return; }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-diary-summary", {
        body: { tema, actividad, participacion, claseLabel: getClaseLabel(claseId) },
      });
      if (error) throw error;
      setResumen(data?.summary || "");
      toast.success("Resumen generado con IA");
    } catch {
      setResumen(`Durante la clase se trabajó el tema "${tema}" mediante ${actividad.toLowerCase()}. La participación del grupo fue ${participacion}.`);
      toast.info("Resumen generado localmente (IA no disponible)");
    } finally { setGenerating(false); }
  };

  const guardarEntrada = async () => {
    if (!user || !claseId) return;
    const { error } = await supabase.from("diario_clase").insert({
      clase_id: claseId, tema_trabajado: tema, actividad_realizada: actividad,
      observaciones: resumen || null, user_id: user.id,
    });
    if (error) { toast.error("Error al guardar"); return; }
    toast.success("Entrada guardada en el diario");
    setDialogOpen(false);
    setTema(""); setActividad(""); setResumen("");
    const { data } = await supabase.from("diario_clase").select("*").order("fecha", { ascending: false });
    const claseIds = new Set(clases.map(c => c.id));
    setEntries((data || []).filter(e => claseIds.has(e.clase_id)));
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Diario de Clase</h1>
        <Button size="lg" className="gap-2" onClick={() => setDialogOpen(true)} disabled={clases.length === 0}>
          <Plus className="h-4 w-4" /> Nueva entrada
        </Button>
      </div>

      {entries.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-3">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No hay entradas en el diario.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => (
            <Card key={entry.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold">{getClaseLabel(entry.clase_id)}</p>
                  <span className="text-sm text-muted-foreground">{entry.fecha}</span>
                </div>
                {entry.tema_trabajado && <p className="text-sm font-medium text-primary">{entry.tema_trabajado}</p>}
                {entry.actividad_realizada && <p className="text-sm text-muted-foreground">{entry.actividad_realizada}</p>}
                {entry.observaciones && <p className="text-sm mt-1">{entry.observaciones}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva entrada del diario</DialogTitle>
            <DialogDescription>Registra lo trabajado en la clase.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Clase</Label>
              <Select value={claseId} onValueChange={setClaseId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {clases.map(c => <SelectItem key={c.id} value={c.id}>{getClaseLabel(c.id)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Tema trabajado</Label><Input placeholder="Ej: Ecuaciones cuadráticas" value={tema} onChange={e => setTema(e.target.value)} /></div>
            <div><Label>Actividad realizada</Label><Input placeholder="Ej: Ejercicios prácticos en grupo" value={actividad} onChange={e => setActividad(e.target.value)} /></div>
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
            <Button variant="outline" className="w-full gap-2" onClick={generarResumen} disabled={generating}>
              {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generando...</> : <><Sparkles className="h-4 w-4" /> Generar resumen con IA</>}
            </Button>
            {resumen && <div><Label>Resumen (editable)</Label><Textarea value={resumen} onChange={e => setResumen(e.target.value)} className="min-h-[100px]" /></div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={guardarEntrada} disabled={!tema.trim()}>Guardar entrada</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
