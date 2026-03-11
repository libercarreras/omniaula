import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Loader2, Image as ImageIcon } from "lucide-react";

export default function ConfiguracionTab() {
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCurrentIcon();
  }, []);

  const fetchCurrentIcon = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "pwa_icon_512")
      .maybeSingle();
    if (data?.value) setIconUrl(data.value);
    setLoading(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/png")) {
      toast.error("Solo se aceptan archivos PNG");
      return;
    }

    // Validate dimensions
    const img = new window.Image();
    img.src = URL.createObjectURL(file);
    await new Promise((resolve) => (img.onload = resolve));

    if (img.width < 512 || img.height < 512) {
      toast.error("La imagen debe ser de al menos 512x512 píxeles");
      URL.revokeObjectURL(img.src);
      return;
    }
    URL.revokeObjectURL(img.src);

    setUploading(true);
    try {
      // Upload 512 icon
      const { error: upErr } = await supabase.storage
        .from("app-assets")
        .upload("pwa-icon-512.png", file, { upsert: true, contentType: "image/png" });
      if (upErr) throw upErr;

      // Also upload as 192 (same file, browser will scale)
      await supabase.storage
        .from("app-assets")
        .upload("pwa-icon-192.png", file, { upsert: true, contentType: "image/png" });

      const { data: urlData } = supabase.storage.from("app-assets").getPublicUrl("pwa-icon-512.png");
      const { data: urlData192 } = supabase.storage.from("app-assets").getPublicUrl("pwa-icon-192.png");

      const publicUrl512 = urlData.publicUrl;
      const publicUrl192 = urlData192.publicUrl;

      // Upsert app_settings
      for (const [key, value] of [["pwa_icon_512", publicUrl512], ["pwa_icon_192", publicUrl192]]) {
        const { data: existing } = await supabase
          .from("app_settings")
          .select("id")
          .eq("key", key)
          .maybeSingle();

        if (existing) {
          await supabase.from("app_settings").update({ value, updated_at: new Date().toISOString() }).eq("key", key);
        } else {
          await supabase.from("app_settings").insert({ key, value });
        }
      }

      setIconUrl(publicUrl512 + "?t=" + Date.now());
      toast.success("Icono PWA actualizado correctamente");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al subir el icono");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-primary" />
          Icono de la aplicación (PWA)
        </CardTitle>
        <CardDescription>
          Subí una imagen PNG de al menos 512×512 px para personalizar el icono de la app instalable.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-muted">
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : iconUrl ? (
              <img src={iconUrl} alt="Icono PWA actual" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
            )}
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {iconUrl ? "Icono personalizado activo" : "Usando icono por defecto"}
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/png"
              onChange={handleUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="gap-2"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? "Subiendo..." : "Subir nuevo icono"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
