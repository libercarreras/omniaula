import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, Clock, Loader2, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type EstadoAsistencia = "presente" | "ausente" | "tardanza" | null;

export default function Asistencia() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [clases, setClases] = useState<any[]>([]);
  const [materias, setMaterias] = useState<Record<string, string>>({});
  const [grupos, setGrupos] = useState<Record<string, string>>({});
  const [claseSeleccionada, setClaseSeleccionada] = useState("");
  const [estudiantes, setEstudiantes] = useState<any[]>([]);
  const [asistencia, setAsistencia] = useState<Record<string, EstadoAsistencia>>({});

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const [clsRes, matRes, grpRes] = await Promise.all([
        supabase.from("clases").select("*"),
        supabase.from("materias").select("id, nombre"),
        supabase.from("grupos").select("id, nombre"),
      ]);
      setClases(clsRes.data || []);
      const mm: Record<string, string> = {};
      (matRes.data || []).forEach(m => { mm[m.id] = m.nombre; });
      setMaterias(mm);
      const gm: Record<string, string> = {};
      (grpRes.data || []).forEach(g => { gm[g.id] = g.nombre; });
      setGrupos(gm);
      if (clsRes.data && clsRes.data.length > 0) setClaseSeleccionada(clsRes.data[0].id);
      setLoading(false);
    };
    fetch();
  }, [user]);

  useEffect(() => {
    if (!claseSeleccionada) return;
    const clase = clases.find(c => c.id === claseSeleccionada);
    if (!clase) return;
    supabase.from("estudiantes").select("id, nombre_completo, numero_lista").eq("grupo_id", clase.grupo_id).order("nombre_completo")
      .then(({ data }) => setEstudiantes(data || []));
  }, [claseSeleccionada, clases]);

  const getClaseLabel = (id: string) => {
    const c = clases.find(cl => cl.id === id);
    if (!c) return "?";
    return `${materias[c.materia_id] || "?"} - ${grupos[c.grupo_id] || "?"}`;
  };

  const marcar = (estId: string, estado: EstadoAsistencia) => {
    setAsistencia(prev => ({ ...prev, [estId]: prev[estId] === estado ? null : estado }));
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
      <div className="flex gap-3 flex-wrap">
        <Select value={claseSeleccionada} onValueChange={setClaseSeleccionada}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            {clases.map(c => <SelectItem key={c.id} value={c.id}>{getClaseLabel(c.id)}</SelectItem>)}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground self-center">{hoy}</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{getClaseLabel(claseSeleccionada)} — {estudiantes.length} estudiantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {estudiantes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No hay estudiantes en este grupo.</p>
          ) : (
            estudiantes.map(est => {
              const estado = asistencia[est.id];
              return (
                <div key={est.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <span className="font-medium">{est.nombre_completo}</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant={estado === "presente" ? "default" : "outline"} className={cn("h-10 w-10 p-0", estado === "presente" && "bg-success hover:bg-success/90")} onClick={() => marcar(est.id, "presente")}><Check className="h-4 w-4" /></Button>
                    <Button size="sm" variant={estado === "ausente" ? "default" : "outline"} className={cn("h-10 w-10 p-0", estado === "ausente" && "bg-destructive hover:bg-destructive/90")} onClick={() => marcar(est.id, "ausente")}><X className="h-4 w-4" /></Button>
                    <Button size="sm" variant={estado === "tardanza" ? "default" : "outline"} className={cn("h-10 w-10 p-0", estado === "tardanza" && "bg-warning hover:bg-warning/90")} onClick={() => marcar(est.id, "tardanza")}><Clock className="h-4 w-4" /></Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
      <Button size="lg" className="w-full md:w-auto">Guardar asistencia</Button>
    </div>
  );
}
