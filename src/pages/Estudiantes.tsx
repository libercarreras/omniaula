import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, UserX, Plus, Pencil, Trash2, Upload, FileSpreadsheet, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useInstitucion } from "@/hooks/useInstitucion";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";

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

interface CSVRow {
  nombre_completo: string;
  numero_lista: number | null;
}

function normalizeName(name: string): string {
  return name.trim().replace(/\s+/g, " ").split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

export default function Estudiantes() {
  const { user } = useAuth();
  const { institucionActiva } = useInstitucion();
  const queryClient = useQueryClient();

  const [filtroGrupo, setFiltroGrupo] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [grupoId, setGrupoId] = useState("");
  const [numeroLista, setNumeroLista] = useState("");
  const [editingEstudiante, setEditingEstudiante] = useState<EstudianteDB | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EstudianteDB | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // CSV import state
  const [csvDialogOpen, setCsvDialogOpen] = useState(false);
  const [csvGrupoId, setCsvGrupoId] = useState("");
  const [csvPreview, setCsvPreview] = useState<CSVRow[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const instId = institucionActiva?.id ?? "";

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: grupos = [], isLoading: loadingGrupos } = useQuery<GrupoDB[]>({
    queryKey: qk.grupos(instId),
    enabled: !!user && !!instId,
    queryFn: async () => {
      const { data, error } = await supabase.from("grupos").select("id, nombre").eq("institucion_id", instId);
      if (error) throw error;
      return data || [];
    },
  });

  const grupoIds = grupos.map(g => g.id);

  const { data: estudiantes = [], isLoading: loadingEstudiantes } = useQuery<EstudianteDB[]>({
    queryKey: qk.estudiantesByInst(instId),
    enabled: grupoIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estudiantes").select("id, nombre_completo, grupo_id, numero_lista").in("grupo_id", grupoIds);
      if (error) throw error;
      return data || [];
    },
  });

  const isLoading = loadingGrupos || (grupoIds.length > 0 && loadingEstudiantes);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: qk.estudiantesByInst(instId) });
  };

  // ── Mutations ─────────────────────────────────────────────────────────────

  const saveMutation = useMutation({
    mutationFn: async ({ finalName, grupoId, numeroLista, editingId }: {
      finalName: string; grupoId: string; numeroLista: string; editingId: string | null;
    }) => {
      if (editingId) {
        const { error } = await supabase.from("estudiantes").update({
          nombre_completo: finalName,
          grupo_id: grupoId,
          numero_lista: numeroLista ? parseInt(numeroLista) : null,
        }).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("estudiantes").insert({
          nombre_completo: finalName,
          grupo_id: grupoId,
          numero_lista: numeroLista ? parseInt(numeroLista) : null,
          user_id: user!.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      if (vars.editingId) {
        toast.success("Estudiante actualizado", { description: `"${vars.finalName}" fue actualizado correctamente.` });
      } else {
        toast.success("Estudiante agregado", { description: `"${vars.finalName}" fue registrado correctamente.` });
      }
      setNombre(""); setGrupoId(""); setNumeroLista("");
      setEditingEstudiante(null);
      setDuplicateWarning(null);
      setDialogOpen(false);
      invalidate();
    },
    onError: (_, vars) => {
      toast.error("Error", { description: vars.editingId ? "No se pudo actualizar el estudiante." : "No se pudo crear el estudiante." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("estudiantes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Estudiante eliminado", { description: `"${deleteTarget?.nombre_completo}" fue eliminado.` });
      setDeleteTarget(null);
      invalidate();
    },
    onError: () => {
      toast.error("Error", { description: "No se pudo eliminar el estudiante. Puede tener registros asociados." });
    },
  });

  const csvMutation = useMutation({
    mutationFn: async ({ records }: { records: { nombre_completo: string; numero_lista: number; grupo_id: string; user_id: string }[] }) => {
      const { error } = await supabase.from("estudiantes").insert(records);
      if (error) throw error;
    },
    onSuccess: (_, { records }) => {
      toast.success("Importación exitosa", { description: `Se importaron ${records.length} estudiantes.` });
      setCsvDialogOpen(false);
      setCsvPreview([]);
      invalidate();
    },
    onError: () => {
      toast.error("Error", { description: "No se pudieron importar los estudiantes." });
    },
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const checkDuplicate = (name: string, groupId: string) => {
    const normalized = normalizeName(name).toLowerCase();
    const existing = estudiantes.find(e =>
      e.grupo_id === groupId &&
      e.nombre_completo.toLowerCase() === normalized &&
      e.id !== editingEstudiante?.id
    );
    setDuplicateWarning(existing ? `Ya existe "${existing.nombre_completo}" en este grupo` : null);
  };

  const openCreate = () => {
    setEditingEstudiante(null);
    setNombre(""); setGrupoId(""); setNumeroLista("");
    setDuplicateWarning(null);
    setDialogOpen(true);
  };

  const openEdit = (est: EstudianteDB) => {
    setEditingEstudiante(est);
    setNombre(est.nombre_completo);
    setGrupoId(est.grupo_id);
    setNumeroLista(est.numero_lista?.toString() || "");
    setDuplicateWarning(null);
    setDialogOpen(true);
  };

  const handleNameBlur = () => {
    if (nombre.trim()) {
      const normalized = normalizeName(nombre);
      setNombre(normalized);
      if (grupoId) checkDuplicate(normalized, grupoId);
    }
  };

  const handleSave = () => {
    if (!user || !nombre.trim() || !grupoId) return;
    saveMutation.mutate({
      finalName: normalizeName(nombre),
      grupoId,
      numeroLista,
      editingId: editingEstudiante?.id ?? null,
    });
  };

  const openCsvDialog = () => {
    setCsvGrupoId(""); setCsvPreview([]);
    setCsvDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) {
        toast.error("Archivo vacío", { description: "El CSV debe tener al menos una fila de datos." });
        return;
      }
      const header = lines[0].toLowerCase().split(/[,;\t]/).map(h => h.trim());
      const nameIdx = header.findIndex(h => h.includes("nombre"));
      const numIdx = header.findIndex(h => h.includes("numero") || h.includes("lista") || h.includes("nro"));

      if (nameIdx === -1) {
        toast.error("Formato incorrecto", { description: "El CSV debe tener una columna 'nombre_completo' o 'nombre'." });
        return;
      }

      const rows: CSVRow[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(/[,;\t]/).map(c => c.trim().replace(/^["']|["']$/g, ""));
        const nom = cols[nameIdx]?.trim();
        if (!nom) continue;
        rows.push({
          nombre_completo: normalizeName(nom),
          numero_lista: numIdx >= 0 && cols[numIdx] ? parseInt(cols[numIdx]) || null : null,
        });
      }
      setCsvPreview(rows);
    };
    reader.readAsText(file);
  };

  const handleCsvImport = () => {
    if (!user || !csvGrupoId || csvPreview.length === 0) return;
    const records = csvPreview.map((r, idx) => ({
      nombre_completo: r.nombre_completo,
      numero_lista: r.numero_lista ?? idx + 1,
      grupo_id: csvGrupoId,
      user_id: user.id,
    }));
    csvMutation.mutate({ records });
  };

  const filtered = filtroGrupo === "todos" ? estudiantes : estudiantes.filter(e => e.grupo_id === filtroGrupo);
  const grupoMap = Object.fromEntries(grupos.map(g => [g.id, g.nombre]));

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">Estudiantes</h1>
          {institucionActiva && <p className="text-sm text-muted-foreground">{institucionActiva.nombre}</p>}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={filtroGrupo} onValueChange={setFiltroGrupo}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Filtrar grupo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {grupos.map(g => <SelectItem key={g.id} value={g.id}>{g.nombre}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2" onClick={openCsvDialog}>
            <Upload className="h-4 w-4" /> Importar CSV
          </Button>
          <Button size="lg" className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" /> Nuevo estudiante
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-3">
            <UserX className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No hay estudiantes registrados.</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={openCreate} className="gap-2">
                <Plus className="h-4 w-4" /> Agregar estudiante
              </Button>
              <Button variant="outline" onClick={openCsvDialog} className="gap-2">
                <Upload className="h-4 w-4" /> Importar CSV
              </Button>
            </div>
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
                <div className="flex items-center gap-2">
                  {est.numero_lista && <span className="text-xs text-muted-foreground">#{est.numero_lista}</span>}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(est)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(est)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEstudiante ? "Editar estudiante" : "Nuevo estudiante"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="est-nombre">Nombre completo</Label>
              <Input id="est-nombre" placeholder="Ej: Juan Pérez" value={nombre}
                onChange={e => {
                  setNombre(e.target.value);
                  setDuplicateWarning(null);
                }}
                onBlur={handleNameBlur}
              />
              {duplicateWarning && (
                <p className="text-xs text-warning flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> {duplicateWarning}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Grupo</Label>
              <Select value={grupoId} onValueChange={v => {
                setGrupoId(v);
                if (nombre.trim()) checkDuplicate(nombre, v);
              }}>
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
            <Button onClick={handleSave} disabled={!nombre.trim() || !grupoId || saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {editingEstudiante ? "Guardar cambios" : "Agregar estudiante"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Import dialog */}
      <Dialog open={csvDialogOpen} onOpenChange={setCsvDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" /> Importar estudiantes desde CSV
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Grupo destino *</Label>
              <Select value={csvGrupoId} onValueChange={setCsvGrupoId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar grupo" /></SelectTrigger>
                <SelectContent>
                  {grupos.map(g => <SelectItem key={g.id} value={g.id}>{g.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Archivo CSV</Label>
              <Input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleFileChange} />
              <p className="text-[11px] text-muted-foreground">
                El archivo debe tener columnas: <strong>nombre_completo</strong> (obligatoria) y <strong>numero_lista</strong> (opcional). Separador: coma, punto y coma o tabulación.
              </p>
            </div>

            {csvPreview.length > 0 && (
              <div className="border rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Nombre</TableHead>
                      <TableHead className="text-xs w-20">N° Lista</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvPreview.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-sm py-1.5">{row.nombre_completo}</TableCell>
                        <TableCell className="text-sm py-1.5">{row.numero_lista || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="px-3 py-2 bg-muted/50 text-xs text-muted-foreground">
                  {csvPreview.length} estudiantes detectados
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCsvDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCsvImport} disabled={!csvGrupoId || csvPreview.length === 0 || csvMutation.isPending}>
              {csvMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Importar {csvPreview.length} estudiantes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar estudiante?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará a "{deleteTarget?.nombre_completo}". Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
