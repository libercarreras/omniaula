import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useDebounceCallback } from "@/hooks/useDebounce";
import { qk } from "@/lib/queryKeys";
import type { EstadoAsistencia } from "@/components/clase/types";
import type { Estudiante } from "@/types/domain";

export function useAsistencia(
  claseId: string | undefined,
  userId: string | undefined,
  estudiantes: Estudiante[],
  selectedDateISO: string,
  isReadonly: boolean,
) {
  const [asistencia, setAsistencia] = useState<Record<string, EstadoAsistencia>>({});
  const [motivos, setMotivos]       = useState<Record<string, string>>({});

  const asistenciaRef = useRef(asistencia);
  asistenciaRef.current = asistencia;
  const motivosRef = useRef(motivos);
  motivosRef.current = motivos;
  const isLoadedRef = useRef(false);

  const { data: rawData } = useQuery({
    queryKey: qk.asistencia(claseId!, selectedDateISO),
    queryFn:  async () => {
      const { data } = await supabase
        .from("asistencia")
        .select("*")
        .eq("clase_id", claseId!)
        .eq("fecha", selectedDateISO);
      return data || [];
    },
    enabled: !!claseId,
  });

  // Sync query data → local state.
  // rawData changes whenever the query key changes (date/clase) or a fresh fetch completes.
  useEffect(() => {
    isLoadedRef.current = false;
    if (!rawData) return;

    if (rawData.length === 0 && !isReadonly && estudiantes.length > 0 && userId) {
      const defaultAsist: Record<string, EstadoAsistencia> = {};
      estudiantes.forEach((e) => { defaultAsist[e.id] = "presente"; });
      setAsistencia(defaultAsist);
      setMotivos({});
      const records = estudiantes.map((e) => ({
        clase_id:      claseId!,
        estudiante_id: e.id,
        estado:        "presente" as const,
        fecha:         selectedDateISO,
        user_id:       userId,
      }));
      supabase.from("asistencia").insert(records).then(({ error }) => {
        if (error) console.error("[OmniAula][useAsistencia] Error auto-inserting:", error);
      });
    } else {
      const asistMap: Record<string, EstadoAsistencia> = {};
      const motivoMap: Record<string, string> = {};
      rawData.forEach((a) => {
        asistMap[a.estudiante_id] = a.estado as EstadoAsistencia;
        if (a.motivo) motivoMap[a.estudiante_id] = a.motivo;
      });
      setAsistencia(asistMap);
      setMotivos(motivoMap);
    }
    isLoadedRef.current = true;
  }, [rawData]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveFn = useCallback(async () => {
    if (!userId || !claseId) return;
    const currentAsist  = asistenciaRef.current;
    const currentMotivos = motivosRef.current;
    const { error: delErr } = await supabase
      .from("asistencia").delete()
      .eq("clase_id", claseId).eq("fecha", selectedDateISO);
    if (delErr) { toast.error("Error al guardar asistencia"); return; }
    const records = Object.entries(currentAsist)
      .filter(([, estado]) => estado !== null)
      .map(([estudiante_id, estado]) => ({
        clase_id: claseId, estudiante_id, estado: estado!, fecha: selectedDateISO, user_id: userId,
        motivo: estado === "retiro" ? (currentMotivos[estudiante_id] || null) : null,
      }));
    if (records.length > 0) {
      const { error } = await supabase.from("asistencia").insert(records);
      if (error) toast.error("Error al guardar asistencia");
    }
  }, [claseId, userId, selectedDateISO]);

  const debounce = useDebounceCallback(saveFn, 2000);

  const marcarAsistencia = (estId: string, estado: EstadoAsistencia, motivo?: string) => {
    setAsistencia((prev) => ({ ...prev, [estId]: prev[estId] === estado ? null : estado }));
    if (motivo !== undefined) {
      setMotivos((prev) => ({ ...prev, [estId]: motivo }));
    } else if (estado !== "retiro") {
      setMotivos((prev) => { const n = { ...prev }; delete n[estId]; return n; });
    }
    if (isLoadedRef.current) debounce.trigger();
  };

  const marcarTodosPresentes = () => {
    const nueva: Record<string, EstadoAsistencia> = {};
    estudiantes.forEach((e) => { nueva[e.id] = "presente"; });
    setAsistencia(nueva);
    if (isLoadedRef.current) debounce.trigger();
    toast.success("✓ Todos presentes");
  };

  const stats = useMemo(() => {
    const total    = estudiantes.length;
    const presentes = Object.values(asistencia).filter((v) => v === "presente").length;
    const faltas    = Object.values(asistencia).filter((v) => v === "falta").length;
    const tardes    = Object.values(asistencia).filter((v) => v === "tarde").length;
    return { total, presentes, faltas, tardes };
  }, [asistencia, estudiantes.length]);

  return { asistencia, motivos, stats, saveStatus: debounce.status, marcarAsistencia, marcarTodosPresentes };
}
