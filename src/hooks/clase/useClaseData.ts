import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useClaseData(claseId: string | undefined, userId: string | undefined) {
  const [loading, setLoading] = useState(true);
  const [clase, setClase] = useState<any>(null);
  const [materia, setMateria] = useState<any>(null);
  const [grupo, setGrupo] = useState<any>(null);
  const [estudiantes, setEstudiantes] = useState<any[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<any[]>([]);

  useEffect(() => {
    if (!userId || !claseId) return;
    let cancelled = false;

    const fetch = async () => {
      setLoading(true);
      const { data: claseData } = await supabase.from("clases").select("*").eq("id", claseId).maybeSingle();
      if (!claseData || cancelled) { setLoading(false); return; }

      const [matRes, grpRes, estRes, evRes] = await Promise.all([
        supabase.from("materias").select("*").eq("id", claseData.materia_id).maybeSingle(),
        supabase.from("grupos").select("*").eq("id", claseData.grupo_id).maybeSingle(),
        supabase.from("estudiantes").select("*").eq("grupo_id", claseData.grupo_id).order("nombre_completo"),
        supabase.from("evaluaciones").select("*").eq("clase_id", claseId),
      ]);

      if (cancelled) return;
      setClase(claseData);
      setMateria(matRes.data);
      setGrupo(grpRes.data);
      setEstudiantes(estRes.data || []);
      setEvaluaciones(evRes.data || []);
      setLoading(false);
    };

    fetch();
    return () => { cancelled = true; };
  }, [userId, claseId]);

  const updateClase = (patch: Partial<any>) =>
    setClase((prev: any) => prev ? { ...prev, ...patch } : prev);

  return { loading, clase, materia, grupo, estudiantes, evaluaciones, updateClase };
}
