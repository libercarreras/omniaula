import { useState, useEffect, useCallback, useRef } from "react";
import { useMemo } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useDebounceCallback } from "@/hooks/useDebounce";
import { tagObservaciones } from "@/components/clase/types";
import type { Enums } from "@/integrations/supabase/types";

export function useObservaciones(
  claseId: string | undefined,
  userId: string | undefined,
  selectedDateISO: string,
) {
  const [obsState, setObsState] = useState<Record<string, string[]>>({});

  const obsRef = useRef(obsState);
  obsRef.current = obsState;
  const isLoadedRef = useRef(false);

  useEffect(() => {
    if (!claseId) return;
    let cancelled = false;
    isLoadedRef.current = false;

    const load = async () => {
      const { data } = await supabase.from("observaciones").select("*").eq("clase_id", claseId).eq("fecha", selectedDateISO);
      if (cancelled) return;
      const oMap: Record<string, string[]> = {};
      (data || []).forEach((o) => {
        if (!oMap[o.estudiante_id]) oMap[o.estudiante_id] = [];
        oMap[o.estudiante_id].push(o.tipo);
      });
      setObsState(oMap);
      isLoadedRef.current = true;
    };

    load();
    return () => { cancelled = true; };
  }, [claseId, selectedDateISO]);

  const saveFn = useCallback(async () => {
    if (!userId || !claseId) return;
    const current = obsRef.current;
    const { error: delErr } = await supabase.from("observaciones").delete().eq("clase_id", claseId).eq("fecha", selectedDateISO);
    if (delErr) { toast.error("Error al guardar observaciones"); return; }
    const records: Array<{ clase_id: string; estudiante_id: string; tipo: Enums<"tipo_observacion">; descripcion: string; fecha: string; user_id: string }> = [];
    Object.entries(current).forEach(([estudiante_id, tipos]) => {
      tipos.forEach(tipo => {
        records.push({
          clase_id: claseId, estudiante_id, tipo: tipo as Enums<"tipo_observacion">,
          descripcion: tagObservaciones.find(t => t.tipo === tipo)?.label || tipo,
          fecha: selectedDateISO, user_id: userId,
        });
      });
    });
    if (records.length > 0) {
      const { error } = await supabase.from("observaciones").insert(records);
      if (error) toast.error("Error al guardar observaciones");
    }
  }, [claseId, userId, selectedDateISO]);

  const debounce = useDebounceCallback(saveFn, 2000);

  const toggleObservacion = (estId: string, obsId: string) => {
    setObsState(prev => {
      const current = prev[estId] || [];
      const next = current.includes(obsId) ? current.filter(id => id !== obsId) : [...current, obsId];
      return { ...prev, [estId]: next };
    });
    if (isLoadedRef.current) debounce.trigger();
  };

  const obsStats = useMemo(() => Object.values(obsState).reduce((acc, arr) => acc + arr.length, 0), [obsState]);

  return { obsState, obsStats, saveStatus: debounce.status, toggleObservacion };
}
