import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  UserPlus, Trash2, KeyRound, Edit, Loader2, Shield, Users, Search,
} from "lucide-react";

interface Docente {
  id: string;
  email: string;
  nombre: string;
  roles: string[];
  created_at: string;
  last_sign_in_at: string | null;
  banned: boolean;
}

export default function Administracion() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ nombre: "", email: "", password: "" });
  const [creating, setCreating] = useState(false);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ userId: "", nombre: "", email: "" });
  const [editing, setEditing] = useState(false);

  // Reset password dialog
  const [resetOpen, setResetOpen] = useState(false);
  const [resetForm, setResetForm] = useState({ userId: "", nombre: "", newPassword: "" });
  const [resetting, setResetting] = useState(false);

  // Delete dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Docente | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (role !== "admin") {
      navigate("/");
      return;
    }
    fetchDocentes();
  }, [role]);

  const fetchDocentes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "list" },
      });
      if (error) throw error;
      setDocentes(data.users || []);
    } catch (err: any) {
      toast.error("Error al cargar docentes");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.nombre || !createForm.email || !createForm.password) {
      toast.error("Completa todos los campos");
      return;
    }
    if (createForm.password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "create", ...createForm },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      toast.success("Docente creado exitosamente");
      setCreateOpen(false);
      setCreateForm({ nombre: "", email: "", password: "" });
      fetchDocentes();
    } catch (err: any) {
      toast.error(err.message || "Error al crear docente");
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditing(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "update", userId: editForm.userId, nombre: editForm.nombre, email: editForm.email },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      toast.success("Docente actualizado");
      setEditOpen(false);
      fetchDocentes();
    } catch (err: any) {
      toast.error(err.message || "Error al editar docente");
    } finally {
      setEditing(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetForm.newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setResetting(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "reset_password", userId: resetForm.userId, newPassword: resetForm.newPassword },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      toast.success("Contraseña restablecida");
      setResetOpen(false);
      setResetForm({ userId: "", nombre: "", newPassword: "" });
    } catch (err: any) {
      toast.error(err.message || "Error al restablecer contraseña");
    } finally {
      setResetting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        body: { action: "delete", userId: deleteTarget.id },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      toast.success("Docente eliminado");
      setDeleteOpen(false);
      setDeleteTarget(null);
      fetchDocentes();
    } catch (err: any) {
      toast.error(err.message || "Error al eliminar docente");
    } finally {
      setDeleting(false);
    }
  };

  const filteredDocentes = docentes.filter((d) =>
    d.nombre.toLowerCase().includes(search.toLowerCase()) ||
    d.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (role !== "admin") return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Administración
          </h1>
          <p className="text-sm text-muted-foreground">Gestión de cuentas de docentes</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Nuevo docente
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar docente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Docentes list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredDocentes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No se encontraron docentes</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredDocentes.map((docente) => (
            <Card key={docente.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{docente.nombre || "Sin nombre"}</p>
                      {docente.roles.includes("admin") && (
                        <Badge className="text-[10px] px-1.5 bg-primary/10 text-primary border-primary/30">Admin</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{docente.email}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Último acceso: {docente.last_sign_in_at
                        ? new Date(docente.last_sign_in_at).toLocaleDateString("es-AR")
                        : "Nunca"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8"
                      onClick={() => {
                        setEditForm({ userId: docente.id, nombre: docente.nombre, email: docente.email });
                        setEditOpen(true);
                      }}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8"
                      onClick={() => {
                        setResetForm({ userId: docente.id, nombre: docente.nombre, newPassword: "" });
                        setResetOpen(true);
                      }}
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                    </Button>
                    {!docente.roles.includes("admin") && (
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => { setDeleteTarget(docente); setDeleteOpen(true); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear nuevo docente</DialogTitle>
            <DialogDescription>El docente podrá iniciar sesión inmediatamente.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={createForm.nombre} onChange={(e) => setCreateForm({ ...createForm, nombre: e.target.value })} placeholder="Nombre completo" required />
            </div>
            <div className="space-y-2">
              <Label>Correo electrónico</Label>
              <Input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} placeholder="profesor@ejemplo.com" required />
            </div>
            <div className="space-y-2">
              <Label>Contraseña</Label>
              <Input type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} placeholder="Mínimo 6 caracteres" required />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={creating} className="gap-2">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Crear docente
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar docente</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={editForm.nombre} onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Correo electrónico</Label>
              <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={editing} className="gap-2">
                {editing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restablecer contraseña</DialogTitle>
            <DialogDescription>Nueva contraseña para {resetForm.nombre}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label>Nueva contraseña</Label>
              <Input type="password" value={resetForm.newPassword} onChange={(e) => setResetForm({ ...resetForm, newPassword: e.target.value })} placeholder="Mínimo 6 caracteres" required />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={resetting} className="gap-2">
                {resetting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Restablecer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar docente?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente la cuenta de <strong>{deleteTarget?.nombre || deleteTarget?.email}</strong> y todos sus datos. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
