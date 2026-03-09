import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Plus, Loader2, MapPin, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useInstitucion, type Institucion } from "@/hooks/useInstitucion";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function Instituciones() {
  const { user } = useAuth();
  const { instituciones, loading, setInstitucionActiva, refresh } = useInstitucion();
  const navigate = useNavigate();

  // Create dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit dialog
  const [editingInst, setEditingInst] = useState<Institucion | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [editDireccion, setEditDireccion] = useState("");
  const [editCiudad, setEditCiudad] = useState("");

  // Delete dialog
  const [deleteInst, setDeleteInst] = useState<Institucion | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleCreate = async () => {
    if (!user || !nombre.trim()) return;
    setSaving(true);
    const { data: inst, error } = await supabase.from("instituciones").insert({
      nombre: nombre.trim(),
      direccion: direccion.trim() || null,
      ciudad: ciudad.trim() || null,
      user_id: user.id,
    }).select().single();

    if (error || !inst) {
      toast({ title: "Error", description: "No se pudo crear la institución.", variant: "destructive" });
      setSaving(false);
      return;
    }

    await supabase.from("profesor_institucion").insert({
      user_id: user.id,
      institucion_id: inst.id,
      rol: "administrador",
    });

    toast({ title: "Institución creada", description: `"${nombre.trim()}" fue creada correctamente.` });
    setNombre(""); setDireccion(""); setCiudad("");
    setDialogOpen(false);
    setSaving(false);
    await refresh();
  };

  const handleEdit = (inst: Institucion, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingInst(inst);
    setEditNombre(inst.nombre);
    setEditDireccion(inst.direccion || "");
    setEditCiudad(inst.ciudad || "");
  };

  const handleSaveEdit = async () => {
    if (!editingInst || !editNombre.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("instituciones").update({
      nombre: editNombre.trim(),
      direccion: editDireccion.trim() || null,
      ciudad: editCiudad.trim() || null,
    }).eq("id", editingInst.id);

    if (error) {
      toast({ title: "Error", description: "No se pudo actualizar la institución.", variant: "destructive" });
    } else {
      toast({ title: "Institución actualizada" });
    }
    setEditingInst(null);
    setSaving(false);
    await refresh();
  };

  const handleDelete = async () => {
    if (!deleteInst) return;
    setDeleting(true);
    const { error } = await supabase.from("instituciones").delete().eq("id", deleteInst.id);
    if (error) {
      toast({ title: "Error", description: "No se pudo eliminar la institución.", variant: "destructive" });
    } else {
      toast({ title: "Institución eliminada" });
    }
    setDeleteInst(null);
    setDeleting(false);
    await refresh();
  };

  const handleSelect = (inst: Institucion) => {
    setInstitucionActiva(inst);
    navigate("/");
  };

  const initialLoadDone = useRef(false);
  useEffect(() => {
    if (!loading) initialLoadDone.current = true;
  }, [loading]);

  if (loading && !initialLoadDone.current) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Mis Instituciones</h1>
        <Button size="lg" className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Nueva institución
        </Button>
      </div>

      {instituciones.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-3">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No perteneces a ninguna institución aún.</p>
            <Button variant="outline" onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Crear institución
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {instituciones.map(inst => (
            <Card key={inst.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleSelect(inst)}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-bold text-lg truncate">{inst.nombre}</h3>
                    {(inst.direccion || inst.ciudad) && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" />
                        {[inst.direccion, inst.ciudad].filter(Boolean).join(", ")}
                      </p>
                    )}
                    <span className="text-xs text-muted-foreground capitalize mt-1 inline-block">{inst.rol}</span>
                  </div>
                  {inst.rol === "administrador" && (
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => handleEdit(inst, e)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteInst(inst); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva institución</DialogTitle>
            <DialogDescription>Completá los datos para crear una nueva institución.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="inst-nombre">Nombre *</Label>
              <Input id="inst-nombre" placeholder="Ej: Escuela N°1" value={nombre} onChange={e => setNombre(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inst-direccion">Dirección</Label>
              <Input id="inst-direccion" placeholder="Ej: Av. Siempre Viva 742" value={direccion} onChange={e => setDireccion(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inst-ciudad">Ciudad</Label>
              <Input id="inst-ciudad" placeholder="Ej: Buenos Aires" value={ciudad} onChange={e => setCiudad(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!nombre.trim() || saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Crear institución
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingInst} onOpenChange={(open) => { if (!open) setEditingInst(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar institución</DialogTitle>
            <DialogDescription>Modificá los datos de la institución.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-nombre">Nombre *</Label>
              <Input id="edit-nombre" value={editNombre} onChange={e => setEditNombre(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-direccion">Dirección</Label>
              <Input id="edit-direccion" value={editDireccion} onChange={e => setEditDireccion(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-ciudad">Ciudad</Label>
              <Input id="edit-ciudad" value={editCiudad} onChange={e => setEditCiudad(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingInst(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={!editNombre.trim() || saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteInst} onOpenChange={(open) => { if (!open) setDeleteInst(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar institución?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará <strong>"{deleteInst?.nombre}"</strong> junto con todos sus grupos y datos asociados. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
