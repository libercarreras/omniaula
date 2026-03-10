import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen, Loader2, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useInstitucion } from "@/hooks/useInstitucion";
import { toast } from "@/hooks/use-toast";

export default function Materias() {
  const { user } = useAuth();
  const { instituciones, institucionActiva } = useInstitucion();
  const [loading, setLoading] = useState(true);
  const [materias, setMaterias] = useState<any[]>([]);
  const [clases, setClases] = useState<any[]>([]);
  const [grupos, setGrupos] = useState<Record<string, string>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [institucionId, setInstitucionId] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [editingMateria, setEditingMateria] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [matRes, clsRes, grpRes] = await Promise.all([
      supabase.from("materias").select("*"),
      supabase.from("clases").select("*"),
      supabase.from("grupos").select("id, nombre"),
    ]);
    setMaterias(matRes.data || []);
    setClases(clsRes.data || []);
    const map: Record<string, string> = {};
    (grpRes.data || []).forEach(g => { map[g.id] = g.nombre; });
    setGrupos(map);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const openCreate = () => {
    setEditingMateria(null);
    setNombre("");
    setInstitucionId(institucionActiva?.id || "");
    setDialogOpen(true);
  };

  const openEdit = (materia: any) => {
    setEditingMateria(materia);
    setNombre(materia.nombre);
    setInstitucionId(materia.institucion_id || "");
    setDialogOpen(true);
  };

  const normalizeName = (n: string) => n.trim().replace(/\s+/g, " ").split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");

  const handleSave = async () => {
    if (!user || !nombre.trim()) return;
    setSaving(true);
    const finalName = normalizeName(nombre);

    if (editingMateria) {
      const { error } = await supabase.from("materias").update({ nombre: finalName, institucion_id: institucionId || null }).eq("id", editingMateria.id);
      setSaving(false);
      if (error) {
        toast({ title: "Error", description: "No se pudo actualizar la materia.", variant: "destructive" });
        return;
      }
      toast({ title: "Materia actualizada", description: `"${finalName}" fue actualizada correctamente.` });
    } else {
      const { error } = await supabase.from("materias").insert({ nombre: finalName, user_id: user.id, institucion_id: institucionId || null });
      setSaving(false);
      if (error) {
        toast({ title: "Error", description: "No se pudo crear la materia.", variant: "destructive" });
        return;
      }
      toast({ title: "Materia creada", description: `"${finalName}" fue agregada correctamente.` });
    }

    setNombre("");
    setEditingMateria(null);
    setDialogOpen(false);
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("materias").delete().eq("id", deleteTarget.id);
    if (error) {
      toast({ title: "Error", description: "No se pudo eliminar la materia. Verificá que no tenga clases asociadas.", variant: "destructive" });
    } else {
      toast({ title: "Materia eliminada", description: `"${deleteTarget.nombre}" fue eliminada.` });
      fetchData();
    }
    setDeleteTarget(null);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Materias</h1>
        <Button size="lg" className="gap-2" onClick={openCreate}><Plus className="h-4 w-4" /> Nueva materia</Button>
      </div>

      {materias.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-3">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No tienes materias creadas aún.</p>
            <Button variant="outline" onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Crear materia</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {materias.map(materia => {
            const clasesMateria = clases.filter(c => c.materia_id === materia.id);
            return (
              <Card key={materia.id}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <h3 className="font-display font-bold text-lg">{materia.nombre}</h3>
                    <Badge variant="secondary">{clasesMateria.length} clases</Badge>
                    {materia.institucion_id && (
                      <Badge variant="outline" className="text-xs">
                        {instituciones.find(i => i.id === materia.institucion_id)?.nombre || "Institución"}
                      </Badge>
                    )}
                    <div className="ml-auto flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(materia)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(materia)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {clasesMateria.map(clase => (
                      <div key={clase.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-semibold">{grupos[clase.grupo_id] || "Sin grupo"}</p>
                          <p className="text-sm text-muted-foreground">{clase.horario || "Sin horario"}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{clase.aula}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMateria ? "Editar materia" : "Nueva materia"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="materia-nombre">Nombre de la materia</Label>
              <Input id="materia-nombre" placeholder="Ej: Matemáticas" value={nombre} onChange={e => setNombre(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSave()} />
            </div>
            <div className="space-y-2">
              <Label>Institución</Label>
              <Select value={institucionId} onValueChange={setInstitucionId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar institución" />
                </SelectTrigger>
                <SelectContent>
                  {instituciones.map(inst => (
                    <SelectItem key={inst.id} value={inst.id}>{inst.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!nombre.trim() || saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingMateria ? "Guardar cambios" : "Crear materia"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar materia?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará "{deleteTarget?.nombre}". Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
