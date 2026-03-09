import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const { setupKey } = await req.json();
    
    // Simple protection - only run once with correct key
    if (setupKey !== "initial-setup-libreta-2026") {
      return new Response(JSON.stringify({ error: "Invalid setup key" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check if admin already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const adminExists = existingUsers?.users?.some(u => u.email === "soporte@soporte.com");
    
    if (adminExists) {
      // Just make sure they have admin role
      const adminUser = existingUsers?.users?.find(u => u.email === "soporte@soporte.com");
      if (adminUser) {
        await supabaseAdmin.from("user_roles").upsert(
          { user_id: adminUser.id, role: "admin" },
          { onConflict: "user_id,role" }
        );
      }
      return new Response(JSON.stringify({ message: "Admin already exists, role ensured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create admin user
    const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
      email: "soporte@soporte.com",
      password: "admin123",
      email_confirm: true,
      user_metadata: { nombre: "Administrador" },
    });

    if (error) throw error;

    // Assign admin role (the trigger will have added 'docente', now add 'admin')
    await supabaseAdmin.from("user_roles").insert({
      user_id: newUser.user.id,
      role: "admin",
    });

    return new Response(JSON.stringify({ 
      message: "Admin created successfully",
      email: "soporte@soporte.com",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("setup-admin error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
