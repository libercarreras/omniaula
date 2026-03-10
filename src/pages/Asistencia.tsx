import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, Clock, Loader2, UserCheck, CheckCheck, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useInstitucion } from "@/hooks/useInstitucion";
import { useDebounceCallback } from "@/hooks/useDebounce";
import { toast } from "sonner";

type EstadoAsistencia = "presente" | "falta" | "tarde" | null;

export default function Asistencia() {
  const { user } = useAuth();
  const { institucionActiva } = useInstitucion();
  const [loading, setLoading] = useState(true);
  const [clases, setClases] = useState<any[]>([]);
  const [materias, setMaterias] = useState<Record<string, string>>({});
  const [grupos, setGrupos] = useState<Record<string, string>>({});
  const [claseSeleccionada, setClaseSeleccionada] = useState("");
  const [estudiantes, setEstudiantes] = useState<any[]>([]);
  const [asistencia, setAsistencia] = useState<Record<string, EstadoAsistencia>>({});

  const hoyISO = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!user || !institucionActiva) return;
    const fetchData = async () => {
      setLoading(true);
      const { data: grpData } = await supabase.from("grupos").select("id, nombre").eq("institucion_id", institucionActiva.id);
      const grupoIds = (grpData || []).map(g => g.id);
      const gm: Record<string, string> = {};
      (grpData || []).forEach(g => { gm[g.id] = g.nombre; });
      setGrupos(gm);

      if (grupoIds.length === 0) { setClases([]); setLoading(false); return; }

      const [clsRes, matRes] = await Promise.all([
        supabase.from("clases").select("*").in("grupo_id", grupoIds),
        supabase.from("materias").select("id, nombre"),
      ]);
      setClases(clsRes.data || []);
      const mm: Record<string, string> = {};
      (matRes.data || []).forEach(m => { mm[m.id] = m.nombre; });
      setMaterias(mm);
      if (clsRes.data && clsRes.data.length > 0) setClaseSeleccionada(clsRes.data[0].id);
      setLoading(false);
    };
    fetchData();
  }, [user, institucionActiva]);

  // Load students and existing attendance when class changes
  useEffect(() => {
    if (!claseSeleccionada || !user) return;
    const clase = clases.find(c => c.id === claseSeleccionada);
    if (!clase) return;
    const loadData = async () => {
      const [estRes, asistRes] = await Promise.all([
        supabase.from("estudiantes").select("id, nombre_completo, numero_lista").eq("grupo_id", clase.grupo_id).order("nombre_completo"),
        supabase.from("asistencia").select("*").eq("clase_id", claseSeleccionada).eq("fecha", hoyISO),
      ]);
      setEstudiantes(estRes.data || []);
      const asistMap: Record<string, EstadoAsistencia> = {};
      (asistRes.data || []).forEach(a => { asistMap[a.estudiante_id] = a.estado as EstadoAsistencia; });
      setAsistencia(asistMap);
    };
    loadData();
  }, [claseSeleccionada, clases, user, hoyISO]);

  // Auto-save with upsert
  const saveAsistenciaFn = useCallback(async () => {
    if (!user || !claseSeleccionada) return;
    const entries = Object.entries(asistencia).filter(([, estado]) => estado !== null);
    for (const [estudiante_id, estado] of entries) {
      const { data: existing } = await supabase.from("asistencia")
        .select("id").eq("clase_id", claseSeleccionada).eq("estudiante_id", estudiante_id).eq("fecha", hoyISO).maybeSingle();
      if (existing) {
        await supabase.from("asistencia").update({ estado: estado! }).eq("id", existing.id);
      } else {
        await supabase.from("asistencia").insert({
          clase_id: claseSeleccionada, estudiante_id, estado: estado!, fecha: hoyISO, user_id: user.id,
        });
      }
    }
    // Remove records for null entries
    const nullEntries = Object.entries(asistencia).filter(([, estado]) => estado === null);
    for (const [estudiante_id] of nullEntries) {
      await supabase.from("asistencia").delete()
        .eq("clase_id", claseSeleccionada).eq("estudiante_id", estudiante_id).eq("fecha", hoyISO);
    }
  }, [asistencia, claseSeleccionada, user, hoyISO]);

  const { trigger, status } = useDebounceCallback(saveAsistenciaFn, 1500);

  const getClaseLabel = (id: string) => {
    const c = clases.find(cl => cl.id === id);
    if (!c) return "?";
    return `${materias[c.materia_id] || "?"} - ${grupos[c.grupo_id] || "?"}`;
  };

  const marcar = (estId: string, estado: EstadoAsistencia) => {
    setAsistencia(prev => ({ ...prev, [estId]: prev[estId] === estado ? null : estado }));
    trigger();
  };

  const marcarTodosPresentes = () => {
    const nueva: Record<string, EstadoAsistencia> = {};
    estudiantes.forEach(e => { nueva[e.id] = "presente"; });
    setAsistencia(nueva);
    trigger();
    toast.success("✓ Todos marcados como presentes");
  };

  const stats = {
    presentes: Object.values(asistencia).filter(v => v === "presente").length,
    faltas: Object.values(asistencia).filter(v => v === "falta").length,
    tardes: Object.values(asistencia).filter(v => v === "tarde").length,
  };

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
              return (
                <div key={est.id} className={cn(
                  "flex items-center justify-between p-3 rounded-lg border-l-4 transition-all",
                  estado === "presente" ? "bg-success/5 border-l-success" :
                  estado === "falta" ? "bg-destructive/5 border-l-destructive" :
                  estado === "tarde" ? "bg-warning/5 border-l-warning" :
                  "bg-muted/30 border-l-transparent"
                )}>
                  <button className="font-medium text-left flex-1" onClick={() => marcar(est.id, "presente")}>
                    {est.nombre_completo}
                  </button>
                  <div className="flex gap-1">
                    <button className={cn("h-11 w-11 rounded-xl flex items-center justify-center transition-all active:scale-95",
                      estado === "presente" ? "bg-success text-success-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    )} onClick={() => marcar(est.id, "presente")}><Check className="h-5 w-5" /></button>
                    <button className={cn("h-11 w-11 rounded-xl flex items-center justify-center transition-all active:scale-95",
                      estado === "falta" ? "bg-destructive text-destructive-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    )} onClick={() => marcar(est.id, "falta")}><X className="h-5 w-5" /></button>
                    <button className={cn("h-11 w-11 rounded-xl flex items-center justify-center transition-all active:scale-95",
                      estado === "tarde" ? "bg-warning text-warning-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    )} onClick={() => marcar(est.id, "tarde")}><Clock className="h-5 w-5" /></button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
