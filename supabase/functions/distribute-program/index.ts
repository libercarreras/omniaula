import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Shared calendar logic (mirrored from src/lib/calendarUtils.ts) ──
// Edge functions can't import from src/, so we inline the same pure logic.
// If you change the algorithm, update both files.

const DIAS_MAP: Record<string, number> = {
  domingo: 0, lunes: 1, martes: 2, miercoles: 3, "miércoles": 3,
  jueves: 4, viernes: 5, sabado: 6, "sábado": 6,
  dom: 0, lun: 1, mar: 2, mie: 3, "mié": 3,
  jue: 4, vie: 5, sab: 6, "sáb": 6,
};

function parseHorarioDias(horario: string | null): number[] {
  if (!horario) return [];
  const lower = horario.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const found: number[] = [];
  const sortedKeys = Object.entries(DIAS_MAP).sort((a, b) => b[0].length - a[0].length);
  for (const [key, val] of sortedKeys) {
    const normKey = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (lower.includes(normKey) && !found.includes(val)) {
      found.push(val);
    }
  }
  return found.sort((a, b) => a - b);
}

function getClassDates(diaNum: number, startDate: Date, endDate: Date): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);
  while (current.getDay() !== diaNum) {
    current.setDate(current.getDate() + 1);
  }
  while (current <= endDate) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 7);
  }
  return dates;
}

// ── End shared calendar logic ──

interface Tema {
  titulo: string;
  subtemas: string[];
}

interface Unidad {
  titulo: string;
  temas: Tema[];
}

interface Estructura {
  unidades: Unidad[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { estructura, horario, fechaInicio, fechaFin } = await req.json();

    if (!estructura?.unidades?.length) {
      return new Response(
        JSON.stringify({ error: "No hay estructura del programa para distribuir." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const diasNums = parseHorarioDias(horario);
    if (diasNums.length === 0) {
      return new Response(
        JSON.stringify({ error: "No se pudo determinar el día de clase desde el horario. Configurá el horario de la clase (ej: 'Lunes 08:00')." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const start = new Date(fechaInicio || new Date().toISOString().split("T")[0]);
    const end = new Date(fechaFin || `${start.getFullYear()}-12-15`);

    let availableDates: string[] = [];
    for (const diaNum of diasNums) {
      availableDates = availableDates.concat(getClassDates(diaNum, start, end));
    }
    availableDates.sort();

    if (availableDates.length === 0) {
      return new Response(
        JSON.stringify({ error: "No hay fechas disponibles para distribuir el programa." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const allTopics: { unidad_index: number; tema_index: number; unidad_titulo: string; tema_titulo: string; subtemas: string[] }[] = [];
    (estructura as Estructura).unidades.forEach((unidad, ui) => {
      unidad.temas.forEach((tema, ti) => {
        allTopics.push({
          unidad_index: ui,
          tema_index: ti,
          unidad_titulo: unidad.titulo,
          tema_titulo: tema.titulo,
          subtemas: tema.subtemas || [],
        });
      });
    });

    const plan: Array<{
      fecha: string;
      unidad_index: number;
      tema_index: number;
      unidad_titulo: string;
      tema_titulo: string;
      subtemas: string[];
    }> = [];

    if (allTopics.length <= availableDates.length) {
      const step = availableDates.length / allTopics.length;
      allTopics.forEach((topic, idx) => {
        const dateIdx = Math.min(Math.floor(idx * step), availableDates.length - 1);
        plan.push({ ...topic, fecha: availableDates[dateIdx] });
      });
    } else {
      const step = allTopics.length / availableDates.length;
      allTopics.forEach((topic, idx) => {
        const dateIdx = Math.min(Math.floor(idx / step), availableDates.length - 1);
        plan.push({ ...topic, fecha: availableDates[dateIdx] });
      });
    }

    return new Response(
      JSON.stringify({
        plan,
        totalClasesDisponibles: availableDates.length,
        totalTemas: allTopics.length,
        fechaInicio: availableDates[0],
        fechaFin: availableDates[availableDates.length - 1],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("distribute-program error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
