import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { qk } from "@/lib/queryKeys";
import type { Clase, Materia, Grupo, Estudiante, Evaluacion } from "@/types/domain";

async function fetchClaseData(claseId: string) {
  const { data: clase } = await supabase.from("clases").select("*").eq("id", claseId).maybeSingle();
  if (!clase) return null;

  const [matRes, grpRes, estRes, evRes] = await Promise.all([
    supabase.from("materias").select("*").eq("id", clase.materia_id).maybeSingle(),
    supabase.from("grupos").select("*").eq("id", clase.grupo_id).maybeSingle(),
    supabase.from("estudiantes").select("*").eq("grupo_id", clase.grupo_id).order("nombre_completo"),
    supabase.from("evaluaciones").select("*").eq("clase_id", claseId),
  ]);

  return {
    clase,
    materia:      matRes.data ?? null,
    grupo:        grpRes.data ?? null,
    estudiantes:  (estRes.data ?? []) as Estudiante[],
    evaluaciones: (evRes.data ?? []) as Evaluacion[],
  };
}

export function useClaseData(claseId: string | undefined, userId: string | undefined) {
  const queryClient = useQueryClient();

  const { isPending, data } = useQuery({
    queryKey: qk.claseData(claseId!),
    queryFn:  () => fetchClaseData(claseId!),
    enabled:  !!userId && !!claseId,
  });

  const updateClase = (patch: Partial<Clase>) => {
    queryClient.setQueryData(qk.claseData(claseId!), (prev: typeof data) =>
      prev ? { ...prev, clase: prev.clase ? { ...prev.clase, ...patch } : prev.clase } : prev,
    );
  };

  return {
    loading:      isPending,
    clase:        (data?.clase        ?? null) as Clase | null,
    materia:      (data?.materia      ?? null) as Materia | null,
    grupo:        (data?.grupo        ?? null) as Grupo | null,
    estudiantes:  (data?.estudiantes  ?? [])   as Estudiante[],
    evaluaciones: (data?.evaluaciones ?? [])   as Evaluacion[],
    updateClase,
  };
}
