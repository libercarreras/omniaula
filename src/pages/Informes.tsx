import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useInstitucion } from "@/hooks/useInstitucion";
import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { AIFullReport } from "@/components/informes/AIFullReport";
import { BulletinCommentGenerator } from "@/components/informes/BulletinCommentGenerator";

export default function Informes() {
  const { user } = useAuth();
  const { institucionActiva } = useInstitucion();
  const [claseSeleccionada, setClaseSeleccionada] = useState("");
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState("");

  const enabled = !!user && !!institucionActiva;

  const { data: gruposData, isPending: loadingGrupos } = useQuery({
    queryKey: qk.grupos(institucionActiva?.id ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grupos")
        .select("id, nombre")
        .eq("institucion_id", institucionActiva!.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled,
  });

  const grupoIds = useMemo(() => (gruposData ?? []).map(g => g.id), [gruposData]);

  const { data: clasesData, isPending: loadingClases } = useQuery({
    queryKey: qk.clasesByInst(institucionActiva?.id ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clases")
        .select("*")
        .in("grupo_id", grupoIds);
      if (error) throw error;
      return data ?? [];
    },
    enabled: enabled && grupoIds.length > 0,
  });

  const { data: materiasData, isPending: loadingMaterias } = useQuery({
    queryKey: qk.materias(user?.id ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase.from("materias").select("id, nombre");
      if (error) throw error;
      return data ?? [];
    },
    enabled,
  });

  const { data: estudiantesData, isPending: loadingEstudiantes } = useQuery({
    queryKey: qk.estudiantesByInst(institucionActiva?.id ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estudiantes")
        .select("id, nombre_completo, grupo_id")
        .in("grupo_id", grupoIds);
      if (error) throw error;
      return data ?? [];
    },
    enabled: enabled && grupoIds.length > 0,
  });

  const clases = clasesData ?? [];
  const estudiantes = estudiantesData ?? [];
  const grupos = useMemo(() => {
    const map: Record<string, string> = {};
    (gruposData ?? []).forEach(g => { map[g.id] = g.nombre; });
    return map;
  }, [gruposData]);
  const materias = useMemo(() => {
    const map: Record<string, string> = {};
    (materiasData ?? []).forEach(m => { map[m.id] = m.nombre; });
    return map;
  }, [materiasData]);

  // Set default selected clase when data arrives
  useEffect(() => {
    if (clases.length > 0 && !claseSeleccionada) {
      setClaseSeleccionada(clases[0].id);
    }
  }, [clases, claseSeleccionada]);

  // Sync estudianteSeleccionado when clase changes
  useEffect(() => {
    if (!claseSeleccionada) return;
    const clase = clases.find(c => c.id === claseSeleccionada);
    if (!clase) return;
    const ests = estudiantes.filter(e => e.grupo_id === clase.grupo_id);
    if (ests.length) setEstudianteSeleccionado(ests[0].id);
    else setEstudianteSeleccionado("");
  }, [claseSeleccionada, clases, estudiantes]);

  const loading = loadingGrupos || loadingClases || loadingMaterias || loadingEstudiantes;

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
