import { useState, useEffect, useMemo } from "react";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { toast } from "sonner";

export default function DiarioClase() {
  const { user } = useAuth();
  const { institucionActiva } = useInstitucion();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [tema, setTema] = useState("");
  const [actividad, setActividad] = useState("");
  const [participacion, setParticipacion] = useState("moderada");
  const [claseId, setClaseId] = useState("");
  const [resumen, setResumen] = useState("");
  const [generating, setGenerating] = useState(false);

  const enabled = !!user && !!institucionActiva;

  const { data: gruposData, isPending: loadingGrupos } = useQuery({
    queryKey: qk.grupos(institucionActiva?.id ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grupos")
        .select("id, nombre")
        .eq("institucion_id", institucionActiva!.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled,
  });

  const grupoIds = useMemo(() => (gruposData ?? []).map(g => g.id), [gruposData]);

  const { data: clasesData, isPending: loadingClases } = useQuery({
    queryKey: qk.clasesByInst(institucionActiva?.id ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clases")
        .select("*")
        .in("grupo_id", grupoIds);
      if (error) throw error;
      return data ?? [];
    },
    enabled: enabled && grupoIds.length > 0,
  });

  const { data: materiasData, isPending: loadingMaterias } = useQuery({
    queryKey: qk.materias(user?.id ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase.from("materias").select("id, nombre");
      if (error) throw error;
      return data ?? [];
    },
    enabled,
  });

  const claseIds = useMemo(() => (clasesData ?? []).map(c => c.id), [clasesData]);

  const { data: entriesData, isPending: loadingEntries } = useQuery({
    queryKey: qk.diarioPage(institucionActiva?.id ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("diario_clase")
        .select("*")
        .in("clase_id", claseIds)
        .order("fecha", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: enabled && claseIds.length > 0,
  });

  const clases = clasesData ?? [];
  const entries = entriesData ?? [];
  const grupos = useMemo(() => {
    const map: Record<string, string> = {};
    (gruposData ?? []).forEach(g => { map[g.id] = g.nombre; });
    return map;
  }, [gruposData]);
  const materias = useMemo(() => {
    const map: Record<string, string> = {};
    (materiasData ?? []).forEach(m => { map[m.id] = m.nombre; });
    return map;
  }, [materiasData]);

  // Set default selected clase when data arrives
  useEffect(() => {
    if (clases.length > 0 && !claseId) {
      setClaseId(clases[0].id);
    }
  }, [clases, claseId]);

  const loading = loadingGrupos || loadingClases || loadingMaterias || loadingEntries;

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

  const { mutate: guardarEntrada } = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("diario_clase").insert({
        clase_id: claseId,
        tema_trabajado: tema,
        actividad_realizada: actividad,
        observaciones: resumen || null,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.diarioPage(institucionActiva!.id) });
      toast.success("Entrada guardada en el diario");
      setDialogOpen(false);
      setTema("");
      setActividad("");
      setResumen("");
    },
    onError: () => toast.error("Error al guardar"),
  });

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
            <Button onClick={() => guardarEntrada()} disabled={!tema.trim()}>Guardar entrada</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
