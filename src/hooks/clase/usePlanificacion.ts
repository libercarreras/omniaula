import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { qk } from "@/lib/queryKeys";
import type { PlanificacionClase } from "@/types/domain";

type PlanificacionData = {
  todayPlan: Pick<PlanificacionClase, "id" | "tema_titulo" | "estado"> | null;
  hasTareaHoy: boolean;
  planificacionStats: { completados: number; total: number };
};

async function fetchPlanificacion(claseId: string, date: string): Promise<PlanificacionData> {
  const [planRes, tareasRes, allPlanRes] = await Promise.all([
    supabase
      .from("planificacion_clases")
      .select("id, tema_titulo, estado")
      .eq("clase_id", claseId)
      .eq("fecha", date)
      .limit(1),
    supabase
      .from("tareas")
      .select("id")
      .eq("clase_id", claseId)
      .gte("created_at", `${date}T00:00:00.000Z`)
      .lte("created_at", `${date}T23:59:59.999Z`)
      .limit(1),
    supabase
      .from("planificacion_clases")
      .select("estado")
      .eq("clase_id", claseId),
  ]);

  const allPlan = allPlanRes.data || [];
  return {
    todayPlan: planRes.data?.[0] ?? null,
    hasTareaHoy: (tareasRes.data || []).length > 0,
    planificacionStats: {
      total:       allPlan.length,
      completados: allPlan.filter((p) => p.estado === "completado" || p.estado === "parcial").length,
    },
  };
}

export function usePlanificacion(claseId: string | undefined, selectedDateISO: string) {
  const queryClient = useQueryClient();
  const [planEstado, setPlanEstado] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: qk.planificacion(claseId!, selectedDateISO),
    queryFn:  () => fetchPlanificacion(claseId!, selectedDateISO),
    enabled:  !!claseId,
  });

  // Sync planEstado from server — can be overridden optimistically via setPlanEstado
  useEffect(() => {
    setPlanEstado(data?.todayPlan?.estado ?? null);
  }, [data]);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: qk.planificacion(claseId!, selectedDateISO) });
  }, [queryClient, claseId, selectedDateISO]);

  return {
    temaPlanificado:    data?.todayPlan?.tema_titulo ?? null,
    todayPlanId:        data?.todayPlan?.id ?? null,
    planEstado,
    setPlanEstado,
    planificacionStats: data?.planificacionStats ?? { completados: 0, total: 0 },
    hasTareaHoy:        data?.hasTareaHoy ?? false,
    // setHasTareaHoy: called by TareaSheet — invalidate to refetch tarea count
    setHasTareaHoy:     invalidate,
    refreshStats:       invalidate,
  };
}
