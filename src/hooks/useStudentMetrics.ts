import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface StudentMetrics {
  asistencia: number; // percentage
  promedio: number;
  participacion: "Alta" | "Media" | "Baja";
  observaciones: string[];
  tareasEntregadas: number;
  tareasTotal: number;
  evaluaciones: { nombre: string; nota: number; fecha: string }[];
  desempeno: { tarea: number; participacion_oral: number; rendimiento_aula: number; conducta: number }; // averages as 0-3 scale
}

const NIVEL_MAP: Record<string, number> = { "B": 0, "M": 1, "A": 2, "A+": 3 };

function avgDesempenoField(records: any[], field: string): number {
  const vals = records.map(r => NIVEL_MAP[r[field]] ?? null).filter(v => v !== null);
  return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : -1;
}

export function useStudentMetrics() {
  const [loading, setLoading] = useState(false);

  const fetchMetrics = useCallback(async (studentId: string, claseId: string): Promise<StudentMetrics> => {
    setLoading(true);
    try {
      const [asistRes, evalRes, obsRes, tareasRes, desempRes] = await Promise.all([
        supabase.from("asistencia").select("estado").eq("estudiante_id", studentId).eq("clase_id", claseId),
        supabase.from("evaluaciones").select("id, nombre, fecha").eq("clase_id", claseId),
        supabase.from("observaciones").select("descripcion, tipo, fecha").eq("estudiante_id", studentId).eq("clase_id", claseId).order("fecha", { ascending: false }).limit(20),
        supabase.from("tareas").select("id").eq("clase_id", claseId),
        supabase.from("desempeno_diario").select("tarea, participacion_oral, rendimiento_aula, conducta").eq("estudiante_id", studentId).eq("clase_id", claseId),
      ]);

      // Asistencia
      const asistData = asistRes.data || [];
      const totalAsist = asistData.length;
      const presentes = asistData.filter(a => a.estado === "presente" || a.estado === "tarde").length;
      const asistencia = totalAsist > 0 ? Math.round((presentes / totalAsist) * 100) : 0;

      // Evaluaciones y notas
      const evals = evalRes.data || [];
      const evalIds = evals.map(e => e.id);
      let notasData: any[] = [];
      if (evalIds.length > 0) {
        const { data } = await supabase.from("notas").select("evaluacion_id, nota").eq("estudiante_id", studentId).in("evaluacion_id", evalIds);
        notasData = data || [];
      }
      const evaluaciones = evals.map(ev => {
        const nota = notasData.find(n => n.evaluacion_id === ev.id);
        return { nombre: ev.nombre, nota: nota?.nota ?? 0, fecha: ev.fecha || "" };
      }).filter(e => e.nota > 0);

      const promedio = evaluaciones.length > 0
        ? Math.round((evaluaciones.reduce((s, e) => s + e.nota, 0) / evaluaciones.length) * 10) / 10
        : 0;

      // Observaciones
      const observaciones = (obsRes.data || []).map(o => o.descripcion);

      // Tareas / Entregas
      const tareaIds = (tareasRes.data || []).map(t => t.id);
      let tareasEntregadas = 0;
      if (tareaIds.length > 0) {
        const { data: entregas } = await supabase.from("entregas").select("id").eq("estudiante_id", studentId).eq("estado", "entregado").in("tarea_id", tareaIds);
        tareasEntregadas = (entregas || []).length;
      }

      // Desempeño
      const desempData = desempRes.data || [];
      const tarea = avgDesempenoField(desempData, "tarea");
      const participacion_oral = avgDesempenoField(desempData, "participacion_oral");
      const rendimiento_aula = avgDesempenoField(desempData, "rendimiento_aula");
      const conducta = avgDesempenoField(desempData, "conducta");

      // Participación general
      let participacion: "Alta" | "Media" | "Baja" = "Media";
      if (participacion_oral >= 2) participacion = "Alta";
      else if (participacion_oral >= 0 && participacion_oral < 1) participacion = "Baja";

      return {
        asistencia,
        promedio,
        participacion,
        observaciones,
        tareasEntregadas,
        tareasTotal: tareaIds.length,
        evaluaciones,
        desempeno: { tarea, participacion_oral, rendimiento_aula, conducta },
      };
    } finally {
      setLoading(false);
    }
  }, []);

  return { fetchMetrics, loading };
}
