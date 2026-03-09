import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, BarChart3, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useInstitucion } from "@/hooks/useInstitucion";
import { AIGroupAnalysis } from "@/components/analisis/AIGroupAnalysis";

export default function Analisis() {
  const { user } = useAuth();
  const { institucionActiva } = useInstitucion();
  const [loading, setLoading] = useState(true);
  const [clases, setClases] = useState<any[]>([]);
  const [materias, setMaterias] = useState<Record<string, string>>({});
  const [grupos, setGrupos] = useState<Record<string, string>>({});
  const [claseSeleccionada, setClaseSeleccionada] = useState("");

  useEffect(() => {
    if (!user || !institucionActiva) return;
    const fetch = async () => {
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
    fetch();
  }, [user, institucionActiva]);

  const getClaseLabel = (id: string) => {
    const c = clases.find(cl => cl.id === id);
    if (!c) return "?";
    return `${materias[c.materia_id] || "?"} - ${grupos[c.grupo_id] || "?"}`;
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (clases.length === 0) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-display font-bold">Análisis</h1>
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-3">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">Crea clases y registra datos para ver análisis.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-display font-bold">Análisis</h1>
        <Select value={claseSeleccionada} onValueChange={setClaseSeleccionada}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            {clases.map(c => <SelectItem key={c.id} value={c.id}>{getClaseLabel(c.id)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <AIGroupAnalysis claseLabel={getClaseLabel(claseSeleccionada)} />

      <Tabs defaultValue="rendimiento" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="rendimiento">Rendimiento</TabsTrigger>
          <TabsTrigger value="riesgo">En riesgo</TabsTrigger>
        </TabsList>

        <TabsContent value="rendimiento" className="space-y-6 mt-4">
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Los gráficos se mostrarán cuando tengas evaluaciones y asistencia registradas.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="riesgo" className="space-y-4 mt-4">
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">El análisis de riesgo se mostrará cuando haya datos suficientes de asistencia y evaluaciones.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
