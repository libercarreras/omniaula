import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateJWT, jsonResponse, errorResponse } from "../_shared/jwt-validator.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405, corsHeaders);
  }

  try {
    const { user, error } = await validateJWT(req, ["docente", "admin"]);

    if (error) {
      return errorResponse(error.message, error.status, corsHeaders);
    }

    if (!user) {
      return errorResponse("Unauthorized", 401, corsHeaders);
    }

    const body = await req.json();
    const { fileName, mimeType, base64 } = body;

    if (!fileName || !mimeType || !base64) {
      return errorResponse(
        "Missing required fields: fileName, mimeType, base64",
        400,
        corsHeaders
      );
    }

    // Decode base64 to extract text content
    const textContent = await extractTextFromFile(base64, mimeType, fileName);

    if (!textContent || textContent.length < 10) {
      return errorResponse(
        "No se pudo extraer texto del archivo. Asegúrate de que el archivo contenga texto legible.",
        400,
        corsHeaders
      );
    }

    // Use AI to extract student names
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Eres un asistente especializado en extraer listas de estudiantes desde documentos administrativos escolares.

Tu tarea es analizar el texto proporcionado y extraer una lista de nombres completos de estudiantes. Sigue estas reglas:

1. Identifica TODOS los nombres de personas que parezcan ser estudiantes
2. Extrae el nombre completo (nombre y apellido)
3. Si ves números de lista o posición, mantén esa asociación
4. Ignora encabezados, pies de página, y texto administrativo
5. Si no estás seguro si algo es un nombre, no lo incluyas
6. Devuelve SOLO la lista en formato JSON, sin explicaciones

Importante:
- Los nombres pueden estar en mayúsculas, minúsculas o mezclados
- Pueden aparecer en tablas, listas o texto continuo
- Ignora nombres de docentes, administrativos, o personas no estudiantes
- Si el archivo contiene columnas como "Nombre", "Alumno", "Estudiante", etc., usa esa información
- Si hay números de lista, intenta capturarlos`;

    const userPrompt = `Extrae la lista de estudiantes del siguiente contenido de archivo:

${textContent.substring(0, 10000)} // Limit to 10k chars

Responde ÚNICAMENTE con un array JSON en este formato exacto:
```json
[
  { "nombre_completo": "Juan Pérez", "numero_lista": 1 },
  { "nombre_completo": "María García", "numero_lista": 2 }
]
```

Si no hay números de lista visibles, usa null para numero_lista.
Si el archivo no contiene estudiantes, devuelve [].`;

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
          temperature: 0.1, // Low temperature for consistent extraction
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
    const content = data.choices?.[0]?.message?.content || "";

    // Extract JSON from the response (in case AI adds markdown formatting)
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\[[\s\S]*\]/);
    let estudiantes: Array<{ nombre_completo: string; numero_lista: number | null }> = [];

    try {
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        estudiantes = JSON.parse(jsonStr);
      } else {
        // Try to parse the whole content as JSON
        estudiantes = JSON.parse(content);
      }
    } catch (e) {
      console.error("Failed to parse AI response as JSON:", content);
      return errorResponse(
        "La IA no devolvió un formato válido. Intenta de nuevo.",
        500,
        corsHeaders
      );
    }

    // Validate and clean the data
    const validEstudiantes = estudiantes.filter(est =>
      est &&
      typeof est.nombre_completo === 'string' &&
      est.nombre_completo.trim().length > 0
    ).map(est => ({
      nombre_completo: est.nombre_completo.trim(),
      numero_lista: typeof est.numero_lista === 'number' ? est.numero_lista : null,
    }));

    return jsonResponse(
      {
        success: true,
        message: `Se extrajeron ${validEstudiantes.length} estudiantes del archivo`,
        estudiantes: validEstudiantes,
      },
      200,
      corsHeaders
    );
  } catch (err) {
    console.error("extract-students-ai error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper function to extract text from different file formats
async function extractTextFromFile(base64: string, mimeType: string, fileName: string): Promise<string> {
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  const bytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

  // For text-based files (CSV, TXT)
  if (mimeType === 'text/csv' || mimeType === 'text/plain' ||
      fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
    return new TextDecoder().decode(bytes);
  }

  // For JSON files (in case someone exports as JSON)
  if (mimeType === 'application/json' || fileName.endsWith('.json')) {
    return JSON.stringify(JSON.parse(new TextDecoder().decode(bytes)), null, 2);
  }

  // For Excel files (XLS/XLSX) - try to read as text (might work for simple exports)
  // In a production environment, you'd use a proper Excel parser
  if (mimeType.includes('spreadsheet') ||
      fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) {
    // Try to extract text from Excel XML format if available
    // For now, we'll attempt to decode as text and hope it's a CSV-like export
    const text = new TextDecoder().decode(bytes);

    // If it looks like it contains readable text, return it
    if (text.length > 0 && /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(text)) {
      // Try to clean up some Excel XML artifacts if present
      const cleaned = text
        .replace(/<[^>]*>/g, ' ') // Remove XML tags
        .replace(/\s+/g, ' ')
        .trim();
      return cleaned;
    }

    throw new Error(
      "Para archivos Excel, por favor guárdalos como CSV (Valores separados por comas) antes de subir. " +
      "En Excel: Archivo → Guardar como → CSV (Comma delimited) (*.csv)"
    );
  }

  // For Word documents (DOCX) - similar approach
  if (mimeType.includes('word') ||
      fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
    const text = new TextDecoder().decode(bytes);

    // DOCX is actually a ZIP with XML - some text might be readable
    if (text.length > 0 && /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(text)) {
      const cleaned = text
        .replace(/<[^>]*>/g, ' ') // Remove XML tags
        .replace(/\s+/g, ' ')
        .trim();
      return cleaned;
    }

    throw new Error(
      "Para archivos Word, es mejor guardarlos como TXT o CSV. " +
      "En Word: Archivo → Guardar como → Texto plano (*.txt)"
    );
  }

  // Fallback: try to decode as text
  return new TextDecoder().decode(bytes);
}
