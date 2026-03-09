import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      claseLabel,
      promedioGeneral,
      asistenciaPromedio,
      totalEstudiantes,
      altoRendimiento,
      bajoRendimiento,
      tareasEntregadasPromedio,
      estudiantesEnRiesgo,
      distribucionNotas,
      tendenciaPromedio,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Eres un asistente pedagógico experto que ayuda a docentes de educación secundaria a analizar el rendimiento de sus grupos.

Genera un análisis claro, profesional y accionable en español. El análisis debe:
- Ser de 4-6 oraciones organizadas en párrafos cortos
- Identificar fortalezas del grupo
- Señalar áreas de mejora
- Detectar patrones preocupantes
- Dar recomendaciones pedagógicas concretas
- Usar un tono profesional pero cercano
- Incluir emojis sutiles para organizar visualmente (📊 📈 ⚠️ 💡)`;

    const riesgoTexto = estudiantesEnRiesgo?.length > 0
      ? estudiantesEnRiesgo.map((e: any) => `${e.nombre}: ${e.motivos.join(", ")}`).join("; ")
      : "Ninguno identificado";

    const userPrompt = `Analiza el siguiente grupo y genera un resumen pedagógico:

Clase: ${claseLabel}
Total estudiantes: ${totalEstudiantes}
Promedio general: ${promedioGeneral}/10
Asistencia promedio: ${asistenciaPromedio}%
Estudiantes alto rendimiento: ${altoRendimiento}
Estudiantes bajo rendimiento: ${bajoRendimiento}
Tareas entregadas promedio: ${tareasEntregadasPromedio}%
Estudiantes en riesgo: ${riesgoTexto}
Distribución de notas: ${JSON.stringify(distribucionNotas)}
Tendencia del promedio: ${JSON.stringify(tendenciaPromedio)}

Genera únicamente el análisis, sin encabezados ni formato markdown.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          stream: false,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Demasiadas solicitudes. Intenta de nuevo en unos segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA agotados." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Error al comunicarse con la IA");
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || "No se pudo generar el análisis.";

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("analyze-group error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
