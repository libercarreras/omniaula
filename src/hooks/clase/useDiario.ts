import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useDebounceCallback } from "@/hooks/useDebounce";

export function useDiario(
  claseId: string | undefined,
  userId: string | undefined,
  selectedDateISO: string,
  isReadonly: boolean,
  temaPlanificado: string | null,
  onPlanEstadoChange: (estado: string) => void,
) {
  const [diarioTema, setDiarioTema] = useState("");
  const [diarioActividad, setDiarioActividad] = useState("");
  const [diarioObs, setDiarioObs] = useState("");
  const [diarioId, setDiarioId] = useState<string | null>(null);
  const [diarioSugerencias, setDiarioSugerencias] = useState<string[]>([]);

  const diarioTemaRef = useRef(diarioTema);
  diarioTemaRef.current = diarioTema;
  const diarioActividadRef = useRef(diarioActividad);
  diarioActividadRef.current = diarioActividad;
  const diarioObsRef = useRef(diarioObs);
  diarioObsRef.current = diarioObs;
  const diarioIdRef = useRef(diarioId);
  diarioIdRef.current = diarioId;
  const isLoadedRef = useRef(false);

  useEffect(() => {
    if (!claseId) return;
    let cancelled = false;
    isLoadedRef.current = false;

    const load = async () => {
      const [diarioRes, prevRes] = await Promise.all([
        supabase.from("diario_clase").select("*").eq("clase_id", claseId).eq("fecha", selectedDateISO).maybeSingle(),
        supabase.from("diario_clase").select("tema_trabajado").eq("clase_id", claseId)
          .not("tema_trabajado", "is", null).neq("fecha", selectedDateISO)
          .order("fecha", { ascending: false }).limit(5),
      ]);
      if (cancelled) return;

      if (diarioRes.error) { console.error("useDiario load:", diarioRes.error); return; }
      if (diarioRes.data) {
        setDiarioId(diarioRes.data.id);
        setDiarioTema(diarioRes.data.tema_trabajado || "");
        setDiarioActividad(diarioRes.data.actividad_realizada || "");
        setDiarioObs(diarioRes.data.observaciones || "");
      } else if (!isReadonly && userId) {
        const { data: newDiario, error: newDiarioError } = await supabase.from("diario_clase").insert({
          clase_id: claseId, user_id: userId, fecha: selectedDateISO,
          tema_trabajado: temaPlanificado || null,
        }).select("id").maybeSingle();
        if (newDiarioError) { console.error("useDiario create:", newDiarioError); }
        if (!cancelled && newDiario) {
          setDiarioId(newDiario.id);
          setDiarioTema(temaPlanificado || "");
        }
        setDiarioActividad("");
        setDiarioObs("");
      } else {
        setDiarioId(null);
        setDiarioTema("");
        setDiarioActividad("");
        setDiarioObs("");
      }

      const temas = (prevRes.data || []).map((d: any) => d.tema_trabajado).filter(Boolean) as string[];
      setDiarioSugerencias([...new Set(temas)]);
      isLoadedRef.current = true;
    };

    load();
    return () => { cancelled = true; };
  }, [claseId, selectedDateISO]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveFn = useCallback(async () => {
    if (!userId || !claseId) return;
    const tema = diarioTemaRef.current;
    const actividad = diarioActividadRef.current;
    const obs = diarioObsRef.current;
    let currentId = diarioIdRef.current;

    try {
      if (currentId) {
        const { error: updateError } = await supabase.from("diario_clase").update({
          tema_trabajado: tema || null,
          actividad_realizada: actividad || null,
          observaciones: obs || null,
        }).eq("id", currentId);
        if (updateError) throw updateError;
      } else {
        const { data, error: insertError } = await supabase.from("diario_clase").insert({
          clase_id: claseId, tema_trabajado: tema || null,
          actividad_realizada: actividad || null,
          observaciones: obs || null,
          user_id: userId, fecha: selectedDateISO,
        }).select("id").maybeSingle();
        if (insertError) throw insertError;
        if (data) { setDiarioId(data.id); currentId = data.id; }
      }

      // Auto-update plan if tema was just filled in
      if (tema && tema.trim()) {
        const { data: todayPlan, error: planError } = await supabase
          .from("planificacion_clases").select("id, estado")
          .eq("clase_id", claseId).eq("fecha", selectedDateISO).eq("estado", "pendiente");
        if (planError) throw planError;
        if (todayPlan && todayPlan.length > 0) {
          const { error: planUpdateError } = await supabase.from("planificacion_clases")
            .update({ estado: "completado", diario_id: currentId })
            .eq("id", todayPlan[0].id);
          if (planUpdateError) throw planUpdateError;
          onPlanEstadoChange("completado");
        }
      }
    } catch (e: any) {
      toast.error(e.message || "Error al guardar el diario");
    }
  }, [claseId, userId, selectedDateISO, onPlanEstadoChange]);

  const debounce = useDebounceCallback(saveFn, 3000);

  const handleDiarioChange = (field: "tema" | "actividad" | "obs", value: string) => {
    if (field === "tema") setDiarioTema(value);
    else if (field === "actividad") setDiarioActividad(value);
    else setDiarioObs(value);
    if (isLoadedRef.current) debounce.trigger();
  };

  return { diarioTema, diarioActividad, diarioObs, diarioId, diarioSugerencias, saveStatus: debounce.status, handleDiarioChange };
}
