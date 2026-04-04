import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useDebounceCallback } from "@/hooks/useDebounce";
import { qk } from "@/lib/queryKeys";
import type { Evaluacion } from "@/types/domain";

export function useNotas(
  claseId: string | undefined,
  userId: string | undefined,
  evaluaciones: Evaluacion[],
) {
  const [notasState, setNotasState]           = useState<Record<string, string>>({});
  const [evaluacionActiva, setEvaluacionActiva] = useState<string | null>(null);

  const notasRef    = useRef(notasState);
  notasRef.current  = notasState;
  const isLoadedRef = useRef(false);

  const evIds    = evaluaciones.map((e) => e.id);
  const evIdsKey = evIds.join(",");

  const { data: rawData } = useQuery({
    queryKey: qk.notas(claseId!, evIdsKey),
    queryFn:  async () => {
      if (evIds.length === 0) return [];
      const { data } = await supabase.from("notas").select("*").in("evaluacion_id", evIds);
      return data || [];
    },
    enabled: !!claseId && evIds.length > 0,
  });

  useEffect(() => {
    isLoadedRef.current = false;
    // When evaluaciones is empty there is no query → rawData stays undefined; still mark loaded.
    if (evIds.length === 0) { setNotasState({}); isLoadedRef.current = true; return; }
    if (!rawData) return;

    const nMap: Record<string, string> = {};
    rawData.forEach((n) => {
      if (n.nota !== null) nMap[`${n.evaluacion_id}-${n.estudiante_id}`] = String(n.nota);
    });
    setNotasState(nMap);
    isLoadedRef.current = true;
  }, [rawData, evIdsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveFn = useCallback(async () => {
    if (!userId || !claseId) return;
    const current = notasRef.current;
    const evIdSet = new Set<string>();
    const records: { evaluacion_id: string; estudiante_id: string; nota: number; user_id: string }[] = [];
    for (const [key, val] of Object.entries(current)) {
      if (val.trim() === "") continue;
      const evaluacion_id  = key.substring(0, 36);
      const estudiante_id  = key.substring(37);
      const nota           = parseFloat(val);
      if (isNaN(nota)) continue;
      evIdSet.add(evaluacion_id);
      records.push({ evaluacion_id, estudiante_id, nota, user_id: userId });
    }
    if (evIdSet.size > 0) {
      const { error: delErr } = await supabase.from("notas").delete().in("evaluacion_id", Array.from(evIdSet));
      if (delErr) { toast.error("Error al guardar notas"); return; }
    }
    if (records.length > 0) {
      const { error } = await supabase.from("notas").insert(records);
      if (error) toast.error("Error al guardar notas");
    }
  }, [claseId, userId]);

  const debounce = useDebounceCallback(saveFn, 2500);

  const handleNotaChange = (key: string, value: string) => {
    setNotasState((prev) => ({ ...prev, [key]: value }));
    if (isLoadedRef.current) debounce.trigger();
  };

  return { notasState, evaluacionActiva, setEvaluacionActiva, saveStatus: debounce.status, handleNotaChange };
}
