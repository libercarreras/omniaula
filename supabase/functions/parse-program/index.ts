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
    const { contenido } = await req.json();

    if (!contenido || contenido.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "El contenido del programa es demasiado corto para analizar." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Eres un asistente pedagógico experto en diseño curricular. Tu tarea es analizar el texto de un programa anual de una materia de educación secundaria y extraer su estructura jerárquica.

Debes devolver ÚNICAMENTE un JSON válido (sin markdown, sin texto adicional) con la siguiente estructura:

{
  "unidades": [
    {
      "titulo": "Nombre de la unidad",
      "temas": [
        {
          "titulo": "Nombre del tema",
          "subtemas": ["Subtema 1", "Subtema 2"]
        }
      ]
    }
  ]
}

Reglas:
- Detecta unidades temáticas, ejes, bloques o módulos como nivel superior
- Dentro de cada unidad, identifica temas o contenidos principales
- Dentro de cada tema, identifica subtemas, actividades o contenidos específicos si los hay
- Si no hay subtemas claros, deja el array vacío
- Si el texto no tiene una estructura clara de unidades, intenta agrupar los contenidos de forma lógica
- Mantén los nombres originales del programa sin modificarlos
- No inventes contenido que no esté en el texto original
- Responde SOLO con el JSON, sin explicaciones`;

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
            { role: "user", content: `Analiza el siguiente programa anual y extrae su estructura:\n\n${contenido}` },
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
    let rawContent = data.choices?.[0]?.message?.content || "";

    // Clean markdown code fences if present
    rawContent = rawContent.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

    let estructura;
    try {
      estructura = JSON.parse(rawContent);
    } catch {
      console.error("Failed to parse AI response:", rawContent);
      return new Response(
        JSON.stringify({ error: "La IA no pudo generar una estructura válida. Intentá de nuevo." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate structure
    if (!estructura.unidades || !Array.isArray(estructura.unidades)) {
      return new Response(
        JSON.stringify({ error: "La estructura generada no es válida." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ estructura }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("parse-program error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
