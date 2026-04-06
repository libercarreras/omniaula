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
    const { nombre_completo, grupo_id, numero_lista } = body;

    if (!nombre_completo || !grupo_id) {
      return errorResponse(
        "Missing required fields: nombre_completo, grupo_id",
        400,
        corsHeaders
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return errorResponse("Server configuration error", 500, corsHeaders);
    }

    const client = createClient(supabaseUrl, supabaseKey);

    const normalized = normalizeName(nombre_completo);

    // Check for duplicate in the same group
    const { data: existing, error: checkError } = await client
      .from("estudiantes")
      .select("id, nombre_completo")
      .eq("grupo_id", grupo_id)
      .eq("nombre_completo", normalized)
      .maybeSingle();

    if (checkError) {
      console.error("Duplicate check error:", checkError);
      return errorResponse("Failed to check for duplicates", 500, corsHeaders);
    }

    if (existing) {
      return errorResponse(
        "Student already exists in this group",
        409,
        corsHeaders
      );
    }

    // Optional: validate group belongs to user's institution
    // (profesores should only add students to groups in their institution)
    // This could be added here if needed

    const { data, error: insertError } = await client
      .from("estudiantes")
      .insert({
        nombre_completo: normalized,
        grupo_id,
        numero_lista: numero_lista ?? null,
        user_id: user.userId,
      })
      .select("id, nombre_completo, grupo_id, numero_lista, user_id")
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return errorResponse(
        `Failed to create student: ${insertError.message}`,
        400,
        corsHeaders
      );
    }

    return jsonResponse(
      {
        success: true,
        message: `Student "${normalized}" created successfully`,
        student: data,
      },
      201,
      corsHeaders
    );
  } catch (err) {
    console.error("Error in create-student:", err);
    return errorResponse("Internal server error", 500, corsHeaders);
  }
});

function normalizeName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
