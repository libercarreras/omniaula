import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserX, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useInstitucion } from "@/hooks/useInstitucion";
import { toast } from "@/hooks/use-toast";

interface EstudianteDB {
  id: string;
  nombre_completo: string;
  grupo_id: string;
  numero_lista: number | null;
}

interface GrupoDB {
  id: string;
  nombre: string;
}

export default function Estudiantes() {
  const { user } = useAuth();
  const { institucionActiva } = useInstitucion();
  const [loading, setLoading] = useState(true);
  const [estudiantes, setEstudiantes] = useState<EstudianteDB[]>([]);
  const [grupos, setGrupos] = useState<GrupoDB[]>([]);
  const [filtroGrupo, setFiltroGrupo] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [grupoId, setGrupoId] = useState("");
  const [numeroLista, setNumeroLista] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    if (!user || !institucionActiva) return;
    setLoading(true);
    const { data: grpData } = await supabase.from("grupos").select("id, nombre").eq("institucion_id", institucionActiva.id);
    const grps = grpData || [];
    setGrupos(grps);
    const grupoIds = grps.map(g => g.id);
    if (grupoIds.length === 0) { setEstudiantes([]); setLoading(false); return; }
    const { data: estData } = await supabase.from("estudiantes").select("id, nombre_completo, grupo_id, numero_lista").in("grupo_id", grupoIds);
    setEstudiantes(estData || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user, institucionActiva]);

  const handleCreate = async () => {
    if (!user || !nombre.trim() || !grupoId) return;
    setSaving(true);
    const { error } = await supabase.from("estudiantes").insert({
      nombre_completo: nombre.trim(),
      grupo_id: grupoId,
      numero_lista: numeroLista ? parseInt(numeroLista) : null,
      user_id: user.id,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: "No se pudo crear el estudiante.", variant: "destructive" });
      return;
    }
    toast({ title: "Estudiante agregado", description: `"${nombre.trim()}" fue registrado correctamente.` });
    setNombre(""); setGrupoId(""); setNumeroLista("");
    setDialogOpen(false);
    fetchData();
  };

  const filtered = filtroGrupo === "todos" ? estudiantes : estudiantes.filter(e => e.grupo_id === filtroGrupo);
  const grupoMap = Object.fromEntries(grupos.map(g => [g.id, g.nombre]));

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">Estudiantes</h1>
          {institucionActiva && <p className="text-sm text-muted-foreground">{institucionActiva.nombre}</p>}
        </div>
        <div className="flex items-center gap-3">
          <Select value={filtroGrupo} onValueChange={setFiltroGrupo}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Filtrar grupo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {grupos.map(g => <SelectItem key={g.id} value={g.id}>{g.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="lg" className="gap-2" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" /> Nuevo estudiante
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-3">
            <UserX className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No hay estudiantes registrados.</p>
            <Button variant="outline" onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Agregar estudiante
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(est => (
            <Card key={est.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{est.nombre_completo}</p>
                  <p className="text-sm text-muted-foreground">{grupoMap[est.grupo_id] || "Sin grupo"}</p>
                </div>
                {est.numero_lista && <span className="text-xs text-muted-foreground">#{est.numero_lista}</span>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo estudiante</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="est-nombre">Nombre completo</Label>
              <Input id="est-nombre" placeholder="Ej: Juan Pérez" value={nombre} onChange={e => setNombre(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Grupo</Label>
              <Select value={grupoId} onValueChange={setGrupoId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar grupo" /></SelectTrigger>
                <SelectContent>
                  {grupos.map(g => <SelectItem key={g.id} value={g.id}>{g.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="est-numero">Número de lista (opcional)</Label>
              <Input id="est-numero" type="number" placeholder="Ej: 15" value={numeroLista} onChange={e => setNumeroLista(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!nombre.trim() || !grupoId || saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Agregar estudiante
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
