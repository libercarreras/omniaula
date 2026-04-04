import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useDebounceCallback } from "@/hooks/useDebounce";
import { qk } from "@/lib/queryKeys";
import type { DiarioClase } from "@/types/domain";

type DiarioQueryData = {
  diario:      DiarioClase | null;
  sugerencias: string[];
};

async function fetchDiario(claseId: string, date: string): Promise<DiarioQueryData> {
  const [diarioRes, prevRes] = await Promise.all([
    supabase
      .from("diario_clase")
      .select("*")
      .eq("clase_id", claseId)
      .eq("fecha", date)
      .maybeSingle(),
    supabase
      .from("diario_clase")
      .select("tema_trabajado")
      .eq("clase_id", claseId)
      .not("tema_trabajado", "is", null)
      .neq("fecha", date)
      .order("fecha", { ascending: false })
      .limit(5),
  ]);

  const temas = (prevRes.data || []).map((d) => d.tema_trabajado).filter(Boolean) as string[];
  return {
    diario:      diarioRes.data ?? null,
    sugerencias: [...new Set(temas)],
  };
}

export function useDiario(
  claseId: string | undefined,
  userId: string | undefined,
  selectedDateISO: string,
  isReadonly: boolean,
  temaPlanificado: string | null,
  onPlanEstadoChange: (estado: string) => void,
) {
  const [diarioTema,       setDiarioTema]       = useState("");
  const [diarioActividad,  setDiarioActividad]  = useState("");
  const [diarioObs,        setDiarioObs]        = useState("");
  const [diarioId,         setDiarioId]         = useState<string | null>(null);
  const [diarioSugerencias, setDiarioSugerencias] = useState<string[]>([]);

  const diarioTemaRef      = useRef(diarioTema);
  diarioTemaRef.current    = diarioTema;
  const diarioActividadRef = useRef(diarioActividad);
  diarioActividadRef.current = diarioActividad;
  const diarioObsRef       = useRef(diarioObs);
  diarioObsRef.current     = diarioObs;
  const diarioIdRef        = useRef(diarioId);
  diarioIdRef.current      = diarioId;
  const isLoadedRef        = useRef(false);

  const { data: rawData } = useQuery({
    queryKey: qk.diario(claseId!, selectedDateISO),
    queryFn:  () => fetchDiario(claseId!, selectedDateISO),
    enabled:  !!claseId,
  });

  useEffect(() => {
    isLoadedRef.current = false;
    if (!rawData) return;

    setDiarioSugerencias(rawData.sugerencias);

    if (rawData.diario) {
      setDiarioId(rawData.diario.id);
      setDiarioTema(rawData.diario.tema_trabajado || "");
      setDiarioActividad(rawData.diario.actividad_realizada || "");
      setDiarioObs(rawData.diario.observaciones || "");
      isLoadedRef.current = true;
    } else if (!isReadonly && userId && claseId) {
      // No entry for this date yet — create one in the background
      void supabase
        .from("diario_clase")
        .insert({
          clase_id:        claseId,
          user_id:         userId,
          fecha:           selectedDateISO,
          tema_trabajado:  temaPlanificado || null,
        })
        .select("id")
        .maybeSingle()
        .then(({ data: newDiario, error }) => {
          if (error) console.error("useDiario create:", error);
          if (newDiario) setDiarioId(newDiario.id);
          setDiarioTema(temaPlanificado || "");
          setDiarioActividad("");
          setDiarioObs("");
          isLoadedRef.current = true;
        });
    } else {
      setDiarioId(null);
      setDiarioTema("");
      setDiarioActividad("");
      setDiarioObs("");
      isLoadedRef.current = true;
    }
  }, [rawData]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveFn = useCallback(async () => {
    if (!userId || !claseId) return;
    const tema      = diarioTemaRef.current;
    const actividad = diarioActividadRef.current;
    const obs       = diarioObsRef.current;
    let currentId   = diarioIdRef.current;

    try {
      if (currentId) {
        const { error: updateError } = await supabase
          .from("diario_clase")
          .update({
            tema_trabajado:      tema      || null,
            actividad_realizada: actividad || null,
            observaciones:       obs       || null,
          })
          .eq("id", currentId);
        if (updateError) throw updateError;
      } else {
        const { data, error: insertError } = await supabase
          .from("diario_clase")
          .insert({
            clase_id:            claseId,
            tema_trabajado:      tema      || null,
            actividad_realizada: actividad || null,
            observaciones:       obs       || null,
            user_id:             userId,
            fecha:               selectedDateISO,
          })
          .select("id")
          .maybeSingle();
        if (insertError) throw insertError;
        if (data) { setDiarioId(data.id); currentId = data.id; }
      }

      // Auto-update plan if tema was just filled in
      if (tema && tema.trim()) {
        const { data: todayPlan, error: planError } = await supabase
          .from("planificacion_clases")
          .select("id, estado")
          .eq("clase_id", claseId)
          .eq("fecha", selectedDateISO)
          .eq("estado", "pendiente");
        if (planError) throw planError;
        if (todayPlan && todayPlan.length > 0) {
          const { error: planUpdateError } = await supabase
            .from("planificacion_clases")
            .update({ estado: "completado", diario_id: currentId })
            .eq("id", todayPlan[0].id);
          if (planUpdateError) throw planUpdateError;
          onPlanEstadoChange("completado");
        }
      }
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error al guardar el diario");
    }
  }, [claseId, userId, selectedDateISO, onPlanEstadoChange]);

  const debounce = useDebounceCallback(saveFn, 3000);

  const handleDiarioChange = (field: "tema" | "actividad" | "obs", value: string) => {
    if (field === "tema")       setDiarioTema(value);
    else if (field === "actividad") setDiarioActividad(value);
    else                            setDiarioObs(value);
    if (isLoadedRef.current) debounce.trigger();
  };

  return {
    diarioTema, diarioActividad, diarioObs, diarioId, diarioSugerencias,
    saveStatus: debounce.status,
    handleDiarioChange,
  };
}
