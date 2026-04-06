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
    const { estudiante_id, evaluacion_id, nota, observacion } = body;

    if (!estudiante_id || !evaluacion_id) {
      return errorResponse(
        "Missing required fields: estudiante_id, evaluacion_id",
        400,
        corsHeaders
      );
    }

    if (nota !== undefined && (nota < 0 || nota > 10)) {
      return errorResponse("Grade must be between 0 and 10", 400, corsHeaders);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return errorResponse("Server configuration error", 500, corsHeaders);
    }

    const client = createClient(supabaseUrl, supabaseKey);

    // Check if evaluation exists and belongs to user's institution (via clase)
    const { data: evalData, error: evalError } = await client
      .from("evaluaciones")
      .select("id, clase_id")
      .eq("id", evaluacion_id)
      .single();

    if (evalError || !evalData) {
      return errorResponse("Evaluation not found", 404, corsHeaders);
    }

    // Get the grupo_id from the clase
    const { data: claseData, error: claseError } = await client
      .from("clases")
      .select("grupo_id")
      .eq("id", evalData.clase_id)
      .single();

    if (claseError || !claseData) {
      return errorResponse("Class not found", 404, corsHeaders);
    }

    // Check if student belongs to the evaluation's group
    const { data: studentData, error: studentError } = await client
      .from("estudiantes")
      .select("grupo_id")
      .eq("id", estudiante_id)
      .single();

    if (studentError || !studentData) {
      return errorResponse("Student not found", 404, corsHeaders);
    }

    if (studentData.grupo_id !== claseData.grupo_id) {
      return errorResponse(
        "Student does not belong to the evaluation's group",
        400,
        corsHeaders
      );
    }

    const { data, error: upsertError } = await client
      .from("notas")
      .upsert({
        estudiante_id,
        evaluacion_id,
        nota: nota ?? null,
        observacion: observacion ?? null,
        user_id: user.userId,
      }, {
        onConflict: "estudiante_id,evaluacion_id",
      })
      .select("id, estudiante_id, evaluacion_id, nota, observacion, user_id")
      .single();

    if (upsertError) {
      console.error("Upsert error:", upsertError);
      return errorResponse(
        `Failed to register grade: ${upsertError.message}`,
        400,
        corsHeaders
      );
    }

    return jsonResponse(
      {
        success: true,
        message: `Grade ${nota !== null ? nota : 'N/A'} registered for student ${estudiante_id}`,
        grade: data,
      },
      200,
      corsHeaders
    );
  } catch (err) {
    console.error("Error in register-grade:", err);
    return errorResponse("Internal server error", 500, corsHeaders);
  }
});
