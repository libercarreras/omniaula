import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface ValidatedUser {
  userId: string;
  email: string;
  role: string;
}

export interface ValidationResult {
  user: ValidatedUser | null;
  error: { status: number; message: string } | null;
}

export async function validateJWT(
  req: Request,
  allowedRoles: string[] = []
): Promise<ValidationResult> {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        user: null,
        error: { status: 401, message: "Missing or invalid authorization header" },
      };
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return {
        user: null,
        error: { status: 500, message: "Missing Supabase configuration" },
      };
    }

    const client = createClient(supabaseUrl, supabaseKey);
    const { data: { user }, error: authError } = await client.auth.getUser(token);

    if (authError || !user) {
      return { user: null, error: { status: 401, message: "Invalid or expired token" } };
    }

    if (allowedRoles.length === 0) {
      return { user: { userId: user.id, email: user.email || "", role: "" }, error: null };
    }

    const { data: roleData, error: roleError } = await client
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleError || !roleData) {
      return { user: null, error: { status: 403, message: "User has no assigned role" } };
    }

    const userRole = roleData.role;
    if (!allowedRoles.includes(userRole)) {
      return {
        user: null,
        error: { status: 403, message: `Access denied. Required: ${allowedRoles.join(", ")}. Your role: ${userRole}` },
      };
    }

    return { user: { userId: user.id, email: user.email || "", role: userRole }, error: null };
  } catch (err) {
    console.error("JWT validation error:", err);
    return { user: null, error: { status: 500, message: "Internal server error" } };
  }
}

export function jsonResponse(data: any, status: number = 200, corsHeaders?: Record<string, string>) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...(corsHeaders || {}) },
  });
}

export function errorResponse(message: string, status: number = 400, corsHeaders?: Record<string, string>) {
  return jsonResponse({ error: message }, status, corsHeaders);
}