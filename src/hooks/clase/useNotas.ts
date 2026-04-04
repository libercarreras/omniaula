import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useDebounceCallback } from "@/hooks/useDebounce";

export function useNotas(
  claseId: string | undefined,
  userId: string | undefined,
  evaluaciones: any[],
) {
  const [notasState, setNotasState] = useState<Record<string, string>>({});
  const [evaluacionActiva, setEvaluacionActiva] = useState<string | null>(null);

  const notasRef = useRef(notasState);
  notasRef.current = notasState;
  const isLoadedRef = useRef(false);

  useEffect(() => {
    if (!claseId) return;
    let cancelled = false;
    isLoadedRef.current = false;

    const load = async () => {
      const evIds = evaluaciones.map(e => e.id);
      if (evIds.length === 0) { setNotasState({}); isLoadedRef.current = true; return; }
      const { data } = await supabase.from("notas").select("*").in("evaluacion_id", evIds);
      if (cancelled) return;
      const nMap: Record<string, string> = {};
      (data || []).forEach((n: any) => {
        if (n.nota !== null) nMap[`${n.evaluacion_id}-${n.estudiante_id}`] = String(n.nota);
      });
      setNotasState(nMap);
      isLoadedRef.current = true;
    };

    load();
    return () => { cancelled = true; };
  }, [claseId, evaluaciones]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveFn = useCallback(async () => {
    if (!userId || !claseId) return;
    const current = notasRef.current;
    const evIds = new Set<string>();
    const records: { evaluacion_id: string; estudiante_id: string; nota: number; user_id: string }[] = [];
    for (const [key, val] of Object.entries(current)) {
      if (val.trim() === "") continue;
      const evaluacion_id = key.substring(0, 36);
      const estudiante_id = key.substring(37);
      const nota = parseFloat(val);
      if (isNaN(nota)) continue;
      evIds.add(evaluacion_id);
      records.push({ evaluacion_id, estudiante_id, nota, user_id: userId });
    }
    if (evIds.size > 0) {
      const { error: delErr } = await supabase.from("notas").delete().in("evaluacion_id", Array.from(evIds));
      if (delErr) { toast.error("Error al guardar notas"); return; }
    }
    if (records.length > 0) {
      const { error } = await supabase.from("notas").insert(records);
      if (error) toast.error("Error al guardar notas");
    }
  }, [claseId, userId]);

  const debounce = useDebounceCallback(saveFn, 2500);

  const handleNotaChange = (key: string, value: string) => {
    setNotasState(prev => ({ ...prev, [key]: value }));
    if (isLoadedRef.current) debounce.trigger();
  };

  return { notasState, evaluacionActiva, setEvaluacionActiva, saveStatus: debounce.status, handleNotaChange };
}
