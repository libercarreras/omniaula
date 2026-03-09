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
      studentName,
      claseLabel,
      asistencia,
      promedio,
      participacion,
      observaciones,
      tareasEntregadas,
      tareasTotal,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Eres un asistente educativo que ayuda a docentes de educación secundaria a redactar comentarios para boletines escolares.

Genera un comentario profesional, claro y constructivo en español para el boletín del estudiante.

El comentario debe:
- Ser de 2-4 oraciones
- Mencionar fortalezas y áreas de mejora
- Ser respetuoso y motivador
- Usar lenguaje profesional pero accesible
- No incluir datos numéricos exactos, sino descripciones cualitativas
- Terminar con una recomendación o perspectiva positiva`;

    const userPrompt = `Genera un comentario para el boletín escolar del siguiente estudiante:

Nombre: ${studentName}
Clase: ${claseLabel}
Asistencia: ${asistencia}%
Promedio de notas: ${promedio}/10
Participación en clase: ${participacion}
Tareas entregadas: ${tareasEntregadas} de ${tareasTotal}
Observaciones del docente: ${observaciones?.join(". ") || "Sin observaciones"}

Genera únicamente el comentario, sin encabezados ni explicaciones adicionales.`;

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
          JSON.stringify({ error: "Créditos de IA agotados. Agrega créditos en la configuración." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Error al comunicarse con la IA");
    }

    const data = await response.json();
    const comment = data.choices?.[0]?.message?.content || "No se pudo generar el comentario.";

    return new Response(JSON.stringify({ comment }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-bulletin-comment error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
