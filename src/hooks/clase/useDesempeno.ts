import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useDebounceCallback } from "@/hooks/useDebounce";
import { qk } from "@/lib/queryKeys";
import type { NivelParticipacion, NivelDesempeno } from "@/components/clase/types";
import type { DesempenoCategoria, DesempenoRecord } from "@/components/clase/tabs/DesempenoTab";
import type { Estudiante } from "@/types/domain";

export function useDesempeno(
  claseId: string | undefined,
  userId: string | undefined,
  estudiantes: Estudiante[],
  selectedDateISO: string,
) {
  const [participacion, setParticipacion] = useState<Record<string, NivelParticipacion | null>>({});
  const [desempeno, setDesempeno]         = useState<Record<string, DesempenoRecord>>({});

  const participacionRef = useRef(participacion);
  participacionRef.current = participacion;
  const desempenoRef = useRef(desempeno);
  desempenoRef.current = desempeno;
  const isLoadedRef = useRef(false);

  const { data: rawData } = useQuery({
    queryKey: qk.desempeno(claseId!, selectedDateISO),
    queryFn:  async () => {
      const [partRes, desRes] = await Promise.all([
        supabase.from("participacion_clase").select("*").eq("clase_id", claseId!).eq("fecha", selectedDateISO),
        supabase.from("desempeno_diario").select("*").eq("clase_id", claseId!).eq("fecha", selectedDateISO),
      ]);
      return { participacion: partRes.data || [], desempeno: desRes.data || [] };
    },
    enabled: !!claseId,
  });

  useEffect(() => {
    isLoadedRef.current = false;
    if (!rawData) return;

    const partMap: Record<string, NivelParticipacion | null> = {};
    rawData.participacion.forEach((p) => { partMap[p.estudiante_id] = p.nivel as NivelParticipacion; });
    setParticipacion(partMap);

    const desMap: Record<string, DesempenoRecord> = {};
    rawData.desempeno.forEach((d) => {
      desMap[d.estudiante_id] = {
        tarea:              (d.tarea              as NivelDesempeno) || null,
        participacion_oral: (d.participacion_oral as NivelDesempeno) || null,
        rendimiento_aula:   (d.rendimiento_aula   as NivelDesempeno) || null,
        conducta:           (d.conducta           as NivelDesempeno) || null,
      };
    });
    setDesempeno(desMap);
    isLoadedRef.current = true;
  }, [rawData]);

  const saveParticipacionFn = useCallback(async () => {
    if (!userId || !claseId) return;
    const current = participacionRef.current;
    const { error: delErr } = await supabase
      .from("participacion_clase").delete()
      .eq("clase_id", claseId).eq("fecha", selectedDateISO);
    if (delErr) { toast.error("Error al guardar participación"); return; }
    const records = Object.entries(current)
      .filter(([, nivel]) => nivel !== null)
      .map(([estudiante_id, nivel]) => ({
        clase_id: claseId, estudiante_id, nivel: nivel as NivelParticipacion,
        fecha: selectedDateISO, user_id: userId,
      }));
    if (records.length > 0) {
      const { error } = await supabase.from("participacion_clase").insert(records);
      if (error) toast.error("Error al guardar participación");
    }
  }, [claseId, userId, selectedDateISO]);

  const saveDesempenoFn = useCallback(async () => {
    if (!userId || !claseId) return;
    const current = desempenoRef.current;
    const { error: delErr } = await supabase
      .from("desempeno_diario").delete()
      .eq("clase_id", claseId).eq("fecha", selectedDateISO);
    if (delErr) { toast.error("Error al guardar desempeño"); return; }
    const records = Object.entries(current)
      .filter(([, r]) => r.tarea || r.participacion_oral || r.rendimiento_aula || r.conducta)
      .map(([estudiante_id, r]) => ({
        clase_id: claseId, estudiante_id, fecha: selectedDateISO, user_id: userId,
        tarea: r.tarea, participacion_oral: r.participacion_oral,
        rendimiento_aula: r.rendimiento_aula, conducta: r.conducta,
      }));
    if (records.length > 0) {
      const { error } = await supabase.from("desempeno_diario").insert(records);
      if (error) toast.error("Error al guardar desempeño");
    }
  }, [claseId, userId, selectedDateISO]);

  const partDebounce = useDebounceCallback(saveParticipacionFn, 2000);
  const desDebounce  = useDebounceCallback(saveDesempenoFn,     2000);

  const marcarParticipacion = (estId: string, nivel: NivelParticipacion) => {
    setParticipacion((prev) => ({ ...prev, [estId]: prev[estId] === nivel ? null : nivel }));
    if (isLoadedRef.current) partDebounce.trigger();
  };

  const cambiarDesempeno = useCallback((estId: string, categoria: DesempenoCategoria, nivel: NivelDesempeno) => {
    setDesempeno((prev) => {
      const current = prev[estId] || { tarea: null, participacion_oral: null, rendimiento_aula: null, conducta: null };
      return { ...prev, [estId]: { ...current, [categoria]: nivel } };
    });
    if (isLoadedRef.current) desDebounce.trigger();
  }, [desDebounce]);

  const marcarTodosDesempenoA = useCallback(() => {
    const nuevo: Record<string, DesempenoRecord> = {};
    estudiantes.forEach((e) => {
      nuevo[e.id] = { tarea: "A", participacion_oral: "A", rendimiento_aula: "A", conducta: "A" };
    });
    setDesempeno(nuevo);
    if (isLoadedRef.current) desDebounce.trigger();
    toast.success("✓ Todos marcados con A");
  }, [estudiantes, desDebounce]);

  return {
    participacion,
    desempeno,
    desempenoSaveStatus: desDebounce.status,
    marcarParticipacion,
    cambiarDesempeno,
    marcarTodosDesempenoA,
  };
}
