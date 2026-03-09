import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { studentName, claseLabel, asistencia, promedio, participacion, observaciones, tareasEntregadas, tareasTotal, evaluaciones } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `Eres un asistente pedagógico para docentes de nivel secundario en Argentina. Genera un informe narrativo detallado sobre el siguiente estudiante. El informe debe ser profesional, objetivo y útil para compartir con familias o archivos escolares.

Datos del estudiante:
- Nombre: ${studentName}
- Clase: ${claseLabel}
- Asistencia: ${asistencia}%
- Promedio de notas: ${promedio}
- Participación: ${participacion}
- Tareas entregadas: ${tareasEntregadas} de ${tareasTotal}
- Observaciones del docente: ${observaciones?.join(". ") || "Sin observaciones"}
${evaluaciones ? `- Evaluaciones: ${JSON.stringify(evaluaciones)}` : ""}

Genera un informe de 3-4 párrafos que incluya:
1. Resumen general del desempeño
2. Fortalezas observadas
3. Áreas de mejora
4. Recomendaciones para el siguiente período

Escribe en español, en tercera persona, con tono profesional y constructivo.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Eres un asistente pedagógico experto en educación secundaria argentina." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Límite de solicitudes excedido. Intenta de nuevo en unos minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const report = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ report }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
