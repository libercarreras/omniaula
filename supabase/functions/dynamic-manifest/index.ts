import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch custom icon URLs from app_settings
  const { data: settings } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["pwa_icon_192", "pwa_icon_512"]);

  const settingsMap: Record<string, string> = {};
  settings?.forEach((s: any) => { settingsMap[s.key] = s.value; });

  const icon192 = settingsMap["pwa_icon_192"] || "/pwa-icon-192.png";
  const icon512 = settingsMap["pwa_icon_512"] || "/pwa-icon-512.png";

  const manifest = {
    name: "OmniAula — Aula inteligente",
    short_name: "OmniAula",
    description: "Aula inteligente para Profesores",
    theme_color: "#2B5EA7",
    background_color: "#f5f7fa",
    display: "standalone",
    orientation: "portrait",
    start_url: "/",
    scope: "/",
    icons: [
      { src: icon192, sizes: "192x192", type: "image/png" },
      { src: icon512, sizes: "512x512", type: "image/png" },
      { src: icon512, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };

  return new Response(JSON.stringify(manifest), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600",
    },
  });
});
