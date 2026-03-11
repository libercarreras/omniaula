import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useInstitucion } from "@/hooks/useInstitucion";
import { AIFullReport } from "@/components/informes/AIFullReport";
import { BulletinCommentGenerator } from "@/components/informes/BulletinCommentGenerator";

export default function Informes() {
  const { user } = useAuth();
  const { institucionActiva } = useInstitucion();
  const [loading, setLoading] = useState(true);
  const [clases, setClases] = useState<any[]>([]);
  const [materias, setMaterias] = useState<Record<string, string>>({});
  const [grupos, setGrupos] = useState<Record<string, string>>({});
  const [estudiantes, setEstudiantes] = useState<any[]>([]);
  const [claseSeleccionada, setClaseSeleccionada] = useState("");
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState("");

  useEffect(() => {
    if (!user || !institucionActiva) return;
    const fetch = async () => {
      setLoading(true);
      const { data: grpData } = await supabase.from("grupos").select("id, nombre").eq("institucion_id", institucionActiva.id);
      const grupoIds = (grpData || []).map(g => g.id);
      const gm: Record<string, string> = {};
      (grpData || []).forEach(g => { gm[g.id] = g.nombre; });
      setGrupos(gm);

      if (grupoIds.length === 0) { setClases([]); setEstudiantes([]); setLoading(false); return; }

      const [clsRes, matRes, estRes] = await Promise.all([
        supabase.from("clases").select("*").in("grupo_id", grupoIds),
        supabase.from("materias").select("id, nombre"),
        supabase.from("estudiantes").select("id, nombre_completo, grupo_id").in("grupo_id", grupoIds),
      ]);
      setClases(clsRes.data || []);
      const mm: Record<string, string> = {};
      (matRes.data || []).forEach(m => { mm[m.id] = m.nombre; });
      setMaterias(mm);
      setEstudiantes(estRes.data || []);
      if (clsRes.data?.length) setClaseSeleccionada(clsRes.data[0].id);
      setLoading(false);
    };
    fetch();
  }, [user, institucionActiva]);

  useEffect(() => {
    if (!claseSeleccionada) return;
    const clase = clases.find(c => c.id === claseSeleccionada);
    if (!clase) return;
    const ests = estudiantes.filter(e => e.grupo_id === clase.grupo_id);
    if (ests.length) setEstudianteSeleccionado(ests[0].id);
    else setEstudianteSeleccionado("");
  }, [claseSeleccionada, clases, estudiantes]);

  const getClaseLabel = (id: string) => {
    const c = clases.find(cl => cl.id === id);
    if (!c) return "?";
    return `${materias[c.materia_id] || "?"} - ${grupos[c.grupo_id] || "?"}`;
  };

  const claseActual = clases.find(c => c.id === claseSeleccionada);
  const estudiantesClase = claseActual ? estudiantes.filter(e => e.grupo_id === claseActual.grupo_id) : [];

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (clases.length === 0) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-display font-bold">Informes</h1>
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-3">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">Crea clases y registra datos para generar informes.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-display font-bold">Informes</h1>
        <Select value={claseSeleccionada} onValueChange={setClaseSeleccionada}>
          <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
          <SelectContent>
            {clases.map(c => <SelectItem key={c.id} value={c.id}>{getClaseLabel(c.id)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="informe-ia" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="informe-ia">Informe IA</TabsTrigger>
          <TabsTrigger value="boletin">Boletín IA</TabsTrigger>
        </TabsList>

        <TabsContent value="informe-ia" className="space-y-4 mt-4">
          <Select value={estudianteSeleccionado} onValueChange={setEstudianteSeleccionado}>
            <SelectTrigger className="w-full md:w-64"><SelectValue placeholder="Seleccionar estudiante" /></SelectTrigger>
            <SelectContent>
              {estudiantesClase.map(e => <SelectItem key={e.id} value={e.id}>{e.nombre_completo}</SelectItem>)}
            </SelectContent>
          </Select>
          {estudianteSeleccionado ? (
            <AIFullReport studentId={estudianteSeleccionado} claseId={claseSeleccionada} claseLabel={getClaseLabel(claseSeleccionada)} estudiantes={estudiantes} />
          ) : (
            <p className="text-sm text-muted-foreground">Selecciona un estudiante para generar un informe.</p>
          )}
        </TabsContent>

        <TabsContent value="boletin" className="space-y-4 mt-4">
          <Select value={estudianteSeleccionado} onValueChange={setEstudianteSeleccionado}>
            <SelectTrigger className="w-full md:w-64"><SelectValue placeholder="Seleccionar estudiante" /></SelectTrigger>
            <SelectContent>
              {estudiantesClase.map(e => <SelectItem key={e.id} value={e.id}>{e.nombre_completo}</SelectItem>)}
            </SelectContent>
          </Select>
          {estudianteSeleccionado ? (
            <BulletinCommentGenerator studentId={estudianteSeleccionado} claseId={claseSeleccionada} claseLabel={getClaseLabel(claseSeleccionada)} estudiantes={estudiantes} />
          ) : (
            <p className="text-sm text-muted-foreground">Selecciona un estudiante.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
