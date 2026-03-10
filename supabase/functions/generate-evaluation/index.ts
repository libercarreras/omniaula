import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { temas, diarioEntries, modalidad, cantidad, dificultad } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const temasText = (temas || []).map((t: any) => `- ${t.unidad_titulo}: ${t.tema_titulo} (${t.estado})`).join("\n");
    const diarioText = (diarioEntries || []).map((d: any) => `- ${d.fecha}: ${d.tema_trabajado || "Sin tema"} | ${d.actividad_realizada || ""}`).join("\n");

    let tipoInstruccion = "";
    if (modalidad === "preguntas") {
      tipoInstruccion = "Genera SOLO preguntas abiertas / de desarrollo. Cada pregunta debe requerir explicación o argumentación.";
    } else if (modalidad === "multiple_opcion") {
      tipoInstruccion = "Genera SOLO preguntas de opción múltiple. Cada pregunta debe tener exactamente 4 opciones (A, B, C, D) con una sola correcta. Incluye distractores plausibles.";
    } else {
      tipoInstruccion = "Genera una MEZCLA equilibrada de preguntas abiertas y de opción múltiple. Las de opción múltiple deben tener 4 opciones con una sola correcta.";
    }

    const systemPrompt = `Eres un experto en pedagogía y evaluación educativa. Tu tarea es generar preguntas de evaluación basándote en los temas enseñados en clase.

Reglas:
- ${tipoInstruccion}
- Nivel de dificultad: ${dificultad}
- Genera exactamente ${cantidad} preguntas
- Las preguntas deben evaluar comprensión, no solo memorización
- Usa el contexto de temas y actividades para hacer preguntas relevantes
- Responde SIEMPRE usando la función generate_questions`;

    const userPrompt = `Temas del programa cubiertos en el periodo:\n${temasText || "(sin datos de planificación)"}\n\nRegistros del diario de clase:\n${diarioText || "(sin registros de diario)"}\n\nGenera ${cantidad} preguntas de nivel ${dificultad}.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
        tools: [
          {
            type: "function",
            function: {
              name: "generate_questions",
              description: "Return structured evaluation questions",
              parameters: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        tipo_pregunta: { type: "string", enum: ["abierta", "multiple_opcion"] },
                        enunciado: { type: "string" },
                        opciones: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              texto: { type: "string" },
                              correcta: { type: "boolean" },
                            },
                            required: ["texto", "correcta"],
                            additionalProperties: false,
                          },
                        },
                        puntos: { type: "number" },
                      },
                      required: ["tipo_pregunta", "enunciado", "puntos"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["questions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_questions" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes. Intenta en unos segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA agotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const args = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ questions: args.questions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-evaluation error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
