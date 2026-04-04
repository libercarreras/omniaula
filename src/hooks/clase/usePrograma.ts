import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useDebounceCallback } from "@/hooks/useDebounce";
import { qk } from "@/lib/queryKeys";
import type { Json } from "@/types/domain";

export function usePrograma(
  claseId: string | undefined,
  userId: string | undefined,
) {
  const [programaContenido,     setProgramaContenido]     = useState("");
  const [programaId,            setProgramaId]            = useState<string | null>(null);
  const [programaArchivoUrl,    setProgramaArchivoUrl]    = useState<string | null>(null);
  const [programaArchivoNombre, setProgramaArchivoNombre] = useState<string | null>(null);
  const [programaEstructura,    setProgramaEstructura]    = useState<Json | null>(null);
  const [uploadingFile,         setUploadingFile]         = useState(false);
  const [savingEstructura,      setSavingEstructura]      = useState(false);

  const isLoadedRef = useRef(false);

  const { data: rawData, isPending } = useQuery({
    queryKey: qk.programa(claseId!),
    queryFn:  async () => {
      const { data, error } = await supabase
        .from("programas_anuales")
        .select("*")
        .eq("clase_id", claseId!)
        .maybeSingle();
      if (error) { console.error("usePrograma load:", error); return null; }
      return data; // null when no programa exists yet — that's a valid settled state
    },
    enabled: !!claseId,
  });

  useEffect(() => {
    isLoadedRef.current = false;
    if (isPending) return; // query hasn't settled yet
    if (rawData) {
      setProgramaId(rawData.id);
      setProgramaContenido(rawData.contenido || "");
      setProgramaArchivoUrl(rawData.archivo_url || null);
      setProgramaArchivoNombre(rawData.archivo_nombre || null);
      setProgramaEstructura(rawData.contenido_estructurado || null);
    }
    // rawData === null → no programa yet; local state stays blank, user can start typing
    isLoadedRef.current = true;
  }, [rawData, isPending]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveFn = useCallback(async () => {
    if (!userId || !claseId) return;
    if (programaId) {
      const { error: saveError } = await supabase
        .from("programas_anuales")
        .update({
          contenido:       programaContenido || null,
          archivo_url:     programaArchivoUrl,
          archivo_nombre:  programaArchivoNombre,
        })
        .eq("id", programaId);
      if (saveError) { toast.error("Error al guardar el programa"); return; }
    } else {
      const { data, error: insertError } = await supabase
        .from("programas_anuales")
        .insert({
          clase_id:      claseId,
          user_id:       userId,
          contenido:     programaContenido || null,
          archivo_url:   programaArchivoUrl,
          archivo_nombre: programaArchivoNombre,
        })
        .select("id")
        .maybeSingle();
      if (insertError) { toast.error("Error al guardar el programa"); return; }
      if (data) setProgramaId(data.id);
    }
  }, [programaContenido, programaArchivoUrl, programaArchivoNombre, programaId, claseId, userId]);

  const debounce = useDebounceCallback(saveFn, 3000);

  const handleProgramaChange = (value: string) => {
    setProgramaContenido(value);
    if (isLoadedRef.current) debounce.trigger();
  };

  const handleProgramaFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId || !claseId) return;
    setUploadingFile(true);
    const path = `${userId}/${claseId}/${file.name}`;
    const { error } = await supabase.storage.from("programas").upload(path, file, { upsert: true });
    if (error) { toast.error("Error al subir archivo"); setUploadingFile(false); return; }
    setProgramaArchivoUrl(path);
    setProgramaArchivoNombre(file.name);
    setUploadingFile(false);
    debounce.trigger();
    toast.success("Archivo subido correctamente");
  };

  const handleRemoveFile = async () => {
    if (!programaArchivoUrl) return;
    await supabase.storage.from("programas").remove([programaArchivoUrl]);
    setProgramaArchivoUrl(null);
    setProgramaArchivoNombre(null);
    debounce.trigger();
    toast.success("Archivo eliminado");
  };

  const handleSaveEstructura = async (est: Json) => {
    if (!claseId || !userId) return;
    setSavingEstructura(true);
    try {
      if (programaId) {
        const { error: estUpdateError } = await supabase
          .from("programas_anuales")
          .update({ contenido_estructurado: est })
          .eq("id", programaId);
        if (estUpdateError) throw estUpdateError;
      } else {
        const { data, error: estInsertError } = await supabase
          .from("programas_anuales")
          .insert({
            clase_id:              claseId,
            user_id:               userId,
            contenido:             programaContenido || null,
            contenido_estructurado: est,
          })
          .select("id")
          .maybeSingle();
        if (estInsertError) throw estInsertError;
        if (data) setProgramaId(data.id);
      }
      setProgramaEstructura(est);
    } catch {
      toast.error("Error al guardar la estructura");
    } finally {
      setSavingEstructura(false);
    }
  };

  return {
    programaContenido, programaId, programaArchivoUrl, programaArchivoNombre,
    programaEstructura, uploadingFile, savingEstructura,
    saveStatus: debounce.status,
    handleProgramaChange, handleProgramaFileUpload, handleRemoveFile, handleSaveEstructura,
  };
}
