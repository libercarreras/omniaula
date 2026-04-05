import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Clock, LogOut, Loader2, UserCheck, CheckCheck, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useInstitucion } from "@/hooks/useInstitucion";
import { useDebounceCallback } from "@/hooks/useDebounce";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";

type EstadoAsistencia = "presente" | "falta" | "tarde" | "retiro" | null;

interface ClaseDB { id: string; grupo_id: string; materia_id: string; }
interface GrupoDB  { id: string; nombre: string; }
interface MateriaDB { id: string; nombre: string; }
interface EstudianteDB { id: string; nombre_completo: string; numero_lista: number | null; }
interface AsistenciaDB { estudiante_id: string; estado: string; motivo?: string | null; }

export default function Asistencia() {
  const { user } = useAuth();
  const { institucionActiva } = useInstitucion();
  const queryClient = useQueryClient();

  const [claseSeleccionada, setClaseSeleccionada] = useState("");
  const [asistencia, setAsistencia] = useState<Record<string, EstadoAsistencia>>({});
  const [motivos, setMotivos] = useState<Record<string, string>>({});
  const [retiroDialog, setRetiroDialog] = useState<{ estId: string; nombre: string } | null>(null);
  const [retiroMotivo, setRetiroMotivo] = useState("");

  const hoyISO = new Date().toISOString().split("T")[0];
  const instId  = institucionActiva?.id ?? "";

  // ── Query A: grupos ────────────────────────────────────────────────────────
  const { data: grupos = [] } = useQuery<GrupoDB[]>({
    queryKey: qk.grupos(instId),
    enabled: !!user && !!instId,
    queryFn: async () => {
      const { data, error } = await supabase.from("grupos").select("id, nombre").eq("institucion_id", instId);
      if (error) throw error;
      return data || [];
    },
  });

  const grupoIds  = grupos.map(g => g.id);
  const gruposMap = Object.fromEntries(grupos.map(g => [g.id, g.nombre]));

  // ── Query B: clases ────────────────────────────────────────────────────────
  const { data: clases = [], isLoading: loadingClases } = useQuery<ClaseDB[]>({
    queryKey: qk.clasesByInst(instId),
    enabled: grupoIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase.from("clases").select("*").in("grupo_id", grupoIds);
      if (error) throw error;
      return data || [];
    },
  });

  // ── Query C: materias ──────────────────────────────────────────────────────
  const { data: materiasData = [], isLoading: loadingMaterias } = useQuery<MateriaDB[]>({
    queryKey: qk.materias(user?.id ?? ""),
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("materias").select("id, nombre");
      if (error) throw error;
      return data || [];
    },
  });

  const materiasMap = Object.fromEntries(materiasData.map(m => [m.id, m.nombre]));

  // Auto-select first clase once clases load
  useEffect(() => {
    if (clases.length > 0 && !claseSeleccionada) {
      setClaseSeleccionada(clases[0].id);
    }
  }, [clases, claseSeleccionada]);

  const grupoId = clases.find(c => c.id === claseSeleccionada)?.grupo_id ?? "";

  // ── Query D: estudiantes for selected clase's grupo ────────────────────────
  const { data: estudiantes = [] } = useQuery<EstudianteDB[]>({
    queryKey: qk.estudiantesByGrupo(grupoId),
    enabled: !!grupoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estudiantes").select("id, nombre_completo, numero_lista")
        .eq("grupo_id", grupoId).order("nombre_completo");
      if (error) throw error;
      return data || [];
    },
  });

  // ── Query E: asistencia initial load ──────────────────────────────────────
  const { data: asistenciaData } = useQuery<AsistenciaDB[]>({
    queryKey: qk.asistencia(claseSeleccionada, hoyISO),
    enabled: !!claseSeleccionada,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asistencia").select("*").eq("clase_id", claseSeleccionada).eq("fecha", hoyISO);
      if (error) throw error;
      return data || [];
    },
  });

  // Seed local state when asistencia query data changes (class switch or initial load)
  useEffect(() => {
    if (!asistenciaData) return;
    const asistMap: Record<string, EstadoAsistencia> = {};
    const motivoMap: Record<string, string> = {};
    asistenciaData.forEach(a => {
      asistMap[a.estudiante_id] = a.estado as EstadoAsistencia;
      if (a.motivo) motivoMap[a.estudiante_id] = a.motivo;
    });
    setAsistencia(asistMap);
    setMotivos(motivoMap);
  }, [asistenciaData]);

  // ── Debounced save ─────────────────────────────────────────────────────────
  const asistenciaRef = useRef(asistencia);
  asistenciaRef.current = asistencia;
  const motivosRef = useRef(motivos);
  motivosRef.current = motivos;

  const saveAsistenciaFn = useCallback(async () => {
    if (!user || !claseSeleccionada) return;
    const currentAsistencia = asistenciaRef.current;
    const currentMotivos    = motivosRef.current;
    await supabase.from("asistencia").delete().eq("clase_id", claseSeleccionada).eq("fecha", hoyISO);
    const records = Object.entries(currentAsistencia)
      .filter(([, estado]) => estado !== null)
      .map(([estudiante_id, estado]) => ({
        clase_id: claseSeleccionada, estudiante_id, estado: estado as "presente" | "falta" | "tarde" | "retiro",
        fecha: hoyISO, user_id: user.id,
        motivo: estado === "retiro" ? (currentMotivos[estudiante_id] || null) : null,
      }));
    if (records.length > 0) await supabase.from("asistencia").insert(records as any);
    queryClient.invalidateQueries({ queryKey: qk.asistencia(claseSeleccionada, hoyISO) });
  }, [claseSeleccionada, user, hoyISO, queryClient]);

  const { trigger, status } = useDebounceCallback(saveAsistenciaFn, 1500);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getClaseLabel = (id: string) => {
    const c = clases.find(cl => cl.id === id);
    if (!c) return "?";
    return `${materiasMap[c.materia_id] || "?"} - ${gruposMap[c.grupo_id] || "?"}`;
  };

  const marcar = (estId: string, estado: EstadoAsistencia, motivo?: string) => {
    setAsistencia(prev => ({ ...prev, [estId]: prev[estId] === estado ? null : estado }));
    if (motivo !== undefined) {
      setMotivos(prev => ({ ...prev, [estId]: motivo }));
    } else if (estado !== "retiro") {
      setMotivos(prev => { const n = { ...prev }; delete n[estId]; return n; });
    }
    trigger();
  };

  const handleRetiroClick = (estId: string, nombre: string) => {
    if (asistencia[estId] === "retiro") {
      marcar(estId, "retiro");
    } else {
      setRetiroMotivo(motivos[estId] || "");
      setRetiroDialog({ estId, nombre });
    }
  };

  const confirmRetiro = () => {
    if (!retiroDialog) return;
    const { estId } = retiroDialog;
    const motivo = retiroMotivo.trim();
    setRetiroDialog(null);
    setRetiroMotivo("");
    requestAnimationFrame(() => { marcar(estId, "retiro", motivo); });
  };

  const marcarTodosPresentes = () => {
    const nueva: Record<string, EstadoAsistencia> = {};
    estudiantes.forEach(e => { nueva[e.id] = "presente"; });
    setAsistencia(nueva);
    setMotivos({});
    trigger();
    toast.success("✓ Todos marcados como presentes");
  };

  const stats = {
    presentes: Object.values(asistencia).filter(v => v === "presente").length,
    faltas:    Object.values(asistencia).filter(v => v === "falta").length,
    tardes:    Object.values(asistencia).filter(v => v === "tarde").length,
  };

  const loading = loadingClases || loadingMaterias;

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (clases.length === 0) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-display font-bold">Asistencia</h1>
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-3">
            <UserCheck className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">Crea una clase para tomar asistencia.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hoy = new Date().toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-display font-bold">Asistencia</h1>
      <div className="flex gap-3 flex-wrap items-center">
        <Select value={claseSeleccionada} onValueChange={setClaseSeleccionada}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            {clases.map(c => <SelectItem key={c.id} value={c.id}>{getClaseLabel(c.id)}</SelectItem>)}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground self-center">{hoy}</p>
        {status !== "idle" && (
          <div className={cn("flex items-center gap-1.5 text-xs font-medium ml-auto",
            status === "saved" ? "text-success" : "text-muted-foreground"
          )}>
            {status === "pending" && <><span className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" /> Pendiente</>}
            {status === "saving" && <><Loader2 className="h-3 w-3 animate-spin" /> Guardando...</>}
            {status === "saved" && <><CheckCircle2 className="h-3 w-3" /> Guardado ✓</>}
          </div>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{getClaseLabel(claseSeleccionada)} — {estudiantes.length} estudiantes</CardTitle>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-success font-semibold">{stats.presentes}P</span>
              <span className="text-destructive font-semibold">{stats.faltas}F</span>
              <span className="text-warning font-semibold">{stats.tardes}T</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button size="sm" className="gap-1.5 bg-success hover:bg-success/90 text-success-foreground mb-3 font-semibold" onClick={marcarTodosPresentes}>
            <CheckCheck className="h-4 w-4" />Todos presentes
          </Button>
          {estudiantes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No hay estudiantes en este grupo.</p>
          ) : (
            estudiantes.map(est => {
              const estado = asistencia[est.id];
              const motivo = motivos[est.id];
              return (
                <div key={est.id}>
                  <div className={cn(
                    "flex items-center justify-between p-3 rounded-lg border-l-4 transition-colors",
                    estado === "presente" ? "bg-success/5 border-l-success" :
                    estado === "falta"    ? "bg-destructive/5 border-l-destructive" :
                    estado === "tarde"    ? "bg-warning/5 border-l-warning" :
                    estado === "retiro"   ? "bg-muted/30 border-l-muted-foreground" :
                    "bg-muted/30 border-l-transparent"
                  )}>
                    <button className="font-medium text-left flex-1" onClick={() => marcar(est.id, "presente")}>
                      {est.nombre_completo}
                    </button>
                    <div className="flex gap-1">
                      <button className={cn("h-11 w-11 rounded-xl flex items-center justify-center transition-colors",
                        estado === "presente" ? "bg-success text-success-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      )} onClick={() => marcar(est.id, "presente")}><Check className="h-5 w-5" /></button>
                      <button className={cn("h-11 w-11 rounded-xl flex items-center justify-center transition-colors",
                        estado === "falta" ? "bg-destructive text-destructive-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      )} onClick={() => marcar(est.id, "falta")}><X className="h-5 w-5" /></button>
                      <button className={cn("h-11 w-11 rounded-xl flex items-center justify-center transition-colors",
                        estado === "tarde" ? "bg-warning text-warning-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      )} onClick={() => marcar(est.id, "tarde")}><Clock className="h-5 w-5" /></button>
                      <button className={cn("h-11 w-11 rounded-xl flex items-center justify-center transition-colors",
                        estado === "retiro" ? "bg-muted-foreground text-background" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      )} onClick={() => handleRetiroClick(est.id, est.nombre_completo)}><LogOut className="h-5 w-5" /></button>
                    </div>
                  </div>
                  {estado === "retiro" && motivo && (
                    <p className="text-xs text-muted-foreground ml-5 mt-1 italic">Motivo: {motivo}</p>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Dialog open={!!retiroDialog} onOpenChange={(open) => { if (!open) setRetiroDialog(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Motivo de retiro anticipado</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {retiroDialog?.nombre} — indicá el motivo del retiro:
          </p>
          <Textarea
            value={retiroMotivo}
            onChange={(e) => setRetiroMotivo(e.target.value)}
            placeholder="Ej: Se sintió mal, lo pasaron a buscar..."
            className="min-h-[80px]"
            maxLength={500}
            translate="no"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRetiroDialog(null)}>Cancelar</Button>
            <Button onClick={confirmRetiro}>Confirmar retiro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
