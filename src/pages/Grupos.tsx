import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, UserPlus, Share2, Loader2, FolderOpen, Pencil, Trash2, BookOpen, MapPin, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InvitarDocente } from "@/components/colaboracion/InvitarDocente";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useInstitucion } from "@/hooks/useInstitucion";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";

interface GrupoDB {
  id: string;
  nombre: string;
  anio: string | null;
  turno: string | null;
  institucion_id: string;
  studentCount?: number;
}

interface ClaseDB {
  id: string;
  materia_id: string;
  grupo_id: string;
  horario: string | null;
  aula: string | null;
}

interface MateriaDB {
  id: string;
  nombre: string;
  color: string | null;
}

export default function Grupos() {
  const { user } = useAuth();
  const { institucionActiva, instituciones } = useInstitucion();
  const queryClient = useQueryClient();

  // Dialog / form state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [selectedGrupo, setSelectedGrupo] = useState<{ id: string; nombre: string } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [anio, setAnio] = useState("");
  const [turno, setTurno] = useState("");
  const [institucionId, setInstitucionId] = useState("");
  const [editingGrupo, setEditingGrupo] = useState<GrupoDB | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GrupoDB | null>(null);

  // Clase creation state
  const [claseDialogOpen, setClaseDialogOpen] = useState(false);
  const [claseGrupoId, setClaseGrupoId] = useState("");
  const [claseMateriaId, setClaseMateriaId] = useState("");
  const [claseHorario, setClaseHorario] = useState("");
  const [claseAula, setClaseAula] = useState("");

  const instId = institucionActiva?.id ?? "";

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: gruposRaw = [], isLoading: loadingGrupos } = useQuery<GrupoDB[]>({
    queryKey: qk.grupos(instId),
    enabled: !!user && !!instId,
    queryFn: async () => {
      const [gruposRes, estudiantesRes] = await Promise.all([
        supabase.from("grupos").select("*").eq("institucion_id", instId),
        supabase.from("estudiantes").select("id, grupo_id"),
      ]);
      const countMap: Record<string, number> = {};
      (estudiantesRes.data || []).forEach(e => {
        countMap[e.grupo_id] = (countMap[e.grupo_id] || 0) + 1;
      });
      return (gruposRes.data || []).map(g => ({ ...g, studentCount: countMap[g.id] || 0 }));
    },
  });

  const grupoIds = gruposRaw.map(g => g.id);

  const { data: clases = [], isLoading: loadingClases } = useQuery<ClaseDB[]>({
    queryKey: qk.clasesByInst(instId),
    enabled: grupoIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("clases").select("id, materia_id, grupo_id, horario, aula").in("grupo_id", grupoIds);
      return data || [];
    },
  });

  const { data: materias = [], isLoading: loadingMaterias } = useQuery<MateriaDB[]>({
    queryKey: qk.materias(user?.id ?? ""),
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("materias").select("id, nombre, color").eq("user_id", user!.id);
      return data || [];
    },
  });

  const { data: collabGrupoIds = [] } = useQuery<string[]>({
    queryKey: qk.grupoColabs(user?.id ?? ""),
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("grupo_colaboradores").select("grupo_id").eq("colaborador_user_id", user!.id).eq("estado", "aceptada");
      return (data || []).map(d => d.grupo_id);
    },
  });
  const grupoIdSet = new Set(gruposRaw.map(g => g.id));
  const sharedGrupoIds = new Set(collabGrupoIds.filter(id => grupoIdSet.has(id)));

  const isLoading = loadingGrupos || loadingMaterias;

  // ── Invalidation helper ───────────────────────────────────────────────────

  const invalidateGrupos = () => queryClient.invalidateQueries({ queryKey: qk.grupos(instId) });
  const invalidateClases = () => queryClient.invalidateQueries({ queryKey: qk.clasesByInst(instId) });

  // ── Mutations ─────────────────────────────────────────────────────────────

  const grupoMutation = useMutation({
    mutationFn: async ({ editing, payload }: { editing: GrupoDB | null; payload: object }) => {
      if (editing) {
        const { error } = await supabase.from("grupos").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("grupos").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: (_, { editing }) => {
      toast.success(editing ? "Grupo actualizado" : "Grupo creado", {
        description: editing
          ? `"${nombre.trim()}" fue actualizado correctamente.`
          : `"${nombre.trim()}" fue agregado correctamente.`,
      });
      setNombre(""); setAnio(""); setTurno(""); setInstitucionId("");
      setEditingGrupo(null);
      setDialogOpen(false);
      invalidateGrupos();
    },
    onError: (_, { editing }) => {
      toast.error("Error", { description: editing ? "No se pudo actualizar el grupo." : "No se pudo crear el grupo." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("grupos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Grupo eliminado", { description: `"${deleteTarget?.nombre}" fue eliminado.` });
      setDeleteTarget(null);
      invalidateGrupos();
    },
    onError: () => {
      toast.error("Error", { description: "No se pudo eliminar el grupo. Puede tener estudiantes o clases asociadas." });
    },
  });

  const claseMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("clases").insert({
        materia_id: claseMateriaId,
        grupo_id: claseGrupoId,
        horario: claseHorario.trim() || null,
        aula: claseAula.trim() || null,
        user_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Clase creada", { description: "La clase fue vinculada al grupo correctamente." });
      setClaseDialogOpen(false);
      invalidateClases();
    },
    onError: () => {
      toast.error("Error", { description: "No se pudo crear la clase." });
    },
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingGrupo(null);
    setNombre(""); setAnio(""); setTurno("");
    setInstitucionId(instId);
    setDialogOpen(true);
  };

  const openEdit = (grupo: GrupoDB) => {
    setEditingGrupo(grupo);
    setNombre(grupo.nombre);
    setAnio(grupo.anio || "");
    setTurno(grupo.turno || "");
    setInstitucionId(grupo.institucion_id);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!user || !nombre.trim() || !institucionId) return;
    const payload = editingGrupo
      ? { nombre: nombre.trim(), anio: anio.trim() || null, turno: turno.trim() || null, institucion_id: institucionId }
      : { nombre: nombre.trim(), anio: anio.trim() || null, turno: turno.trim() || null, user_id: user.id, institucion_id: institucionId };
    grupoMutation.mutate({ editing: editingGrupo, payload });
  };

  const openClaseDialog = (grupoId: string) => {
    setClaseGrupoId(grupoId);
    setClaseMateriaId(""); setClaseHorario(""); setClaseAula("");
    setClaseDialogOpen(true);
  };

  const materiaMap = Object.fromEntries(materias.map(m => [m.id, m.nombre]));

  if (isLoading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Grupos</h1>
          {institucionActiva && <p className="text-sm text-muted-foreground">{institucionActiva.nombre}</p>}
        </div>
        <Button size="lg" className="gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nuevo grupo
        </Button>
      </div>

      {gruposRaw.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-3">
            <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No tienes grupos creados en esta institución.</p>
            <Button variant="outline" onClick={openCreate} className="gap-2"><Plus className="h-4 w-4" /> Crear grupo</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gruposRaw.map((grupo) => {
            const isShared = sharedGrupoIds.has(grupo.id);
            const grupoClases = clases.filter(c => c.grupo_id === grupo.id);
            return (
              <Card key={grupo.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-bold text-xl">{grupo.nombre}</h3>
                        {isShared && (
                          <Badge variant="secondary" className="text-[10px] gap-1">
                            <Share2 className="h-3 w-3" /> Compartido
                          </Badge>
                        )}
                      </div>
                      {grupo.anio && <p className="text-sm text-muted-foreground mt-1">{grupo.anio} {grupo.turno ? `· ${grupo.turno}` : ""}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-sm bg-muted rounded-full px-3 py-1">
                        <Users className="h-3.5 w-3.5" />
                        {grupo.studentCount}
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(grupo)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(grupo)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Clases del grupo */}
                  {grupoClases.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {grupoClases.map(clase => (
                        <Link key={clase.id} to={`/clase/${clase.id}`}>
                          <Badge variant="secondary" className="gap-1 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                            <BookOpen className="h-3 w-3" />
                            {materiaMap[clase.materia_id] || "?"}
                            {clase.horario && <span className="text-[10px] opacity-70">· {clase.horario}</span>}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openClaseDialog(grupo.id)}>
                      <Plus className="h-3.5 w-3.5" /> Crear clase
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setSelectedGrupo({ id: grupo.id, nombre: grupo.nombre }); setInviteOpen(true); }}>
                      <UserPlus className="h-3.5 w-3.5" /> Invitar docente
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog crear/editar grupo */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGrupo ? "Editar grupo" : "Nuevo grupo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="grupo-nombre">Nombre del grupo *</Label>
              <Input id="grupo-nombre" placeholder="Ej: 3°A" value={nombre} onChange={e => setNombre(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Institución *</Label>
              <Select value={institucionId} onValueChange={setInstitucionId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar institución" /></SelectTrigger>
                <SelectContent>
                  {instituciones.map(inst => (
                    <SelectItem key={inst.id} value={inst.id}>{inst.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="grupo-anio">Año</Label>
              <Input id="grupo-anio" placeholder="Ej: 2026" value={anio} onChange={e => setAnio(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grupo-turno">Turno</Label>
              <Input id="grupo-turno" placeholder="Ej: Mañana" value={turno} onChange={e => setTurno(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!nombre.trim() || !institucionId || grupoMutation.isPending}>
              {grupoMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingGrupo ? "Guardar cambios" : "Crear grupo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog crear clase */}
      <Dialog open={claseDialogOpen} onOpenChange={setClaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva clase</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Materia *</Label>
              <Select value={claseMateriaId} onValueChange={setClaseMateriaId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar materia" /></SelectTrigger>
                <SelectContent>
                  {materias.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {materias.length === 0 && (
                <p className="text-xs text-muted-foreground">No tienes materias. <Link to="/materias" className="text-primary underline">Crear una</Link></p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="clase-horario">Horario (opcional)</Label>
              <Input id="clase-horario" placeholder="Ej: Lunes 8:00-9:30" value={claseHorario} onChange={e => setClaseHorario(e.target.value)} />
              <p className="text-[11px] text-muted-foreground">Formato sugerido: Día HH:MM-HH:MM</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="clase-aula">Aula (opcional)</Label>
              <Input id="clase-aula" placeholder="Ej: Aula 3B" value={claseAula} onChange={e => setClaseAula(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClaseDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => claseMutation.mutate()} disabled={!claseMateriaId || claseMutation.isPending}>
              {claseMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Crear clase
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete grupo dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar grupo?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el grupo "{deleteTarget?.nombre}". Esta acción no se puede deshacer. Si tiene estudiantes o clases asociadas, no se podrá eliminar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedGrupo && (
        <InvitarDocente open={inviteOpen} onClose={() => setInviteOpen(false)} grupoId={selectedGrupo.id} grupoNombre={selectedGrupo.nombre} />
      )}
    </div>
  );
}
