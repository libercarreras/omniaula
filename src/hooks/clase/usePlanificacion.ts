import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { PlanificacionClase } from "@/types/domain";

export function usePlanificacion(claseId: string | undefined, selectedDateISO: string) {
  const [temaPlanificado, setTemaPlanificado] = useState<string | null>(null);
  const [planEstado, setPlanEstado] = useState<string | null>(null);
  const [planificacionStats, setPlanificacionStats] = useState({ completados: 0, total: 0 });
  const [hasTareaHoy, setHasTareaHoy] = useState(false);

  const refreshStats = useCallback(async () => {
    if (!claseId) return;
    const { data } = await supabase.from("planificacion_clases").select("estado").eq("clase_id", claseId);
    const all = data || [];
    setPlanificacionStats({
      total: all.length,
      completados: all.filter((p) => p.estado === "completado" || p.estado === "parcial").length,
    });
  }, [claseId]);

  useEffect(() => {
    if (!claseId) return;
    let cancelled = false;

    const load = async () => {
      const [planRes, tareasRes, allPlanRes] = await Promise.all([
        supabase.from("planificacion_clases").select("tema_titulo, estado").eq("clase_id", claseId).eq("fecha", selectedDateISO),
        supabase.from("tareas").select("id").eq("clase_id", claseId)
          .gte("created_at", `${selectedDateISO}T00:00:00.000Z`)
          .lte("created_at", `${selectedDateISO}T23:59:59.999Z`).limit(1),
        supabase.from("planificacion_clases").select("estado").eq("clase_id", claseId),
      ]);

      if (cancelled) return;

      const planData = (planRes.data || []) as Pick<PlanificacionClase, "tema_titulo" | "estado">[];
      if (planData.length > 0) {
        setTemaPlanificado(planData[0].tema_titulo);
        setPlanEstado(planData[0].estado);
      } else {
        setTemaPlanificado(null);
        setPlanEstado(null);
      }

      setHasTareaHoy((tareasRes.data || []).length > 0);

      const allPlan = allPlanRes.data || [];
      setPlanificacionStats({
        total: allPlan.length,
        completados: allPlan.filter((p) => p.estado === "completado" || p.estado === "parcial").length,
      });
    };

    load();
    return () => { cancelled = true; };
  }, [claseId, selectedDateISO]);

  return { temaPlanificado, planEstado, setPlanEstado, planificacionStats, hasTareaHoy, setHasTareaHoy, refreshStats };
}
