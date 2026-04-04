import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useDebounceCallback } from "@/hooks/useDebounce";

export function usePrograma(
  claseId: string | undefined,
  userId: string | undefined,
  isInitialLoad: React.MutableRefObject<boolean>,
) {
  const [programaContenido, setProgramaContenido] = useState("");
  const [programaId, setProgramaId] = useState<string | null>(null);
  const [programaArchivoUrl, setProgramaArchivoUrl] = useState<string | null>(null);
  const [programaArchivoNombre, setProgramaArchivoNombre] = useState<string | null>(null);
  const [programaEstructura, setProgramaEstructura] = useState<any>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [savingEstructura, setSavingEstructura] = useState(false);

  useEffect(() => {
    if (!claseId) return;
    let cancelled = false;

    const load = async () => {
      const { data } = await supabase.from("programas_anuales").select("*").eq("clase_id", claseId).maybeSingle();
      if (cancelled || !data) return;
      setProgramaId(data.id);
      setProgramaContenido(data.contenido || "");
      setProgramaArchivoUrl((data as any).archivo_url || null);
      setProgramaArchivoNombre((data as any).archivo_nombre || null);
      setProgramaEstructura((data as any).contenido_estructurado || null);
    };

    load();
    return () => { cancelled = true; };
  }, [claseId]);

  const saveFn = useCallback(async () => {
    if (!userId || !claseId) return;
    if (programaId) {
      await supabase.from("programas_anuales").update({
        contenido: programaContenido || null,
        archivo_url: programaArchivoUrl,
        archivo_nombre: programaArchivoNombre,
      }).eq("id", programaId);
    } else {
      const { data } = await supabase.from("programas_anuales").insert({
        clase_id: claseId, user_id: userId,
        contenido: programaContenido || null,
        archivo_url: programaArchivoUrl,
        archivo_nombre: programaArchivoNombre,
      }).select("id").maybeSingle();
      if (data) setProgramaId(data.id);
    }
  }, [programaContenido, programaArchivoUrl, programaArchivoNombre, programaId, claseId, userId]);

  const debounce = useDebounceCallback(saveFn, 3000);

  const handleProgramaChange = (value: string) => {
    setProgramaContenido(value);
    if (!isInitialLoad.current) debounce.trigger();
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

  const handleSaveEstructura = async (est: any) => {
    if (!claseId || !userId) return;
    setSavingEstructura(true);
    try {
      if (programaId) {
        await supabase.from("programas_anuales").update({ contenido_estructurado: est as any }).eq("id", programaId);
      } else {
        const { data } = await supabase.from("programas_anuales").insert({
          clase_id: claseId, user_id: userId,
          contenido: programaContenido || null,
          contenido_estructurado: est as any,
        }).select("id").maybeSingle();
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
