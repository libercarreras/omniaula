import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, Save, Crown, Shield } from "lucide-react";

export default function Perfil() {
  const { profile, user, planLimits, refreshProfile } = useAuth();
  const [nombre, setNombre] = useState(profile?.nombre || "");
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  const handleSaveProfile = async () => {
    if (!user || !nombre.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ nombre: nombre.trim() })
      .eq("user_id", user.id);
    setSaving(false);

    if (error) {
      toast.error("Error al guardar perfil");
    } else {
      toast.success("Perfil actualizado");
      refreshProfile();
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Contraseña actualizada");
      setNewPassword("");
    }
  };

  const initials = profile?.nombre
    ? profile.nombre.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-display font-bold">Mi perfil</h1>

      {/* Avatar + Plan */}
      <Card>
        <CardContent className="p-6 flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-display font-bold text-lg">{profile?.nombre || "Docente"}</p>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
          </div>
          <Badge
            variant={profile?.plan === "premium" ? "default" : "secondary"}
            className="gap-1"
          >
            {profile?.plan === "premium" ? (
              <><Crown className="h-3 w-3" /> Premium</>
            ) : (
              <><Shield className="h-3 w-3" /> Gratuito</>
            )}
          </Badge>
        </CardContent>
      </Card>

      {/* Edit profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos personales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre completo</Label>
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre"
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label>Correo electrónico</Label>
            <Input value={profile?.email || ""} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">
              El correo no se puede cambiar directamente
            </p>
          </div>
          <Button onClick={handleSaveProfile} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar cambios
          </Button>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cambiar contraseña</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nueva contraseña</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              autoComplete="new-password"
            />
          </div>
          <Button
            variant="outline"
            onClick={handleChangePassword}
            disabled={changingPassword || !newPassword}
            className="gap-2"
          >
            {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Cambiar contraseña
          </Button>
        </CardContent>
      </Card>

      {/* Plan info */}
      {planLimits && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tu plan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="font-medium">Grupos</p>
                <p className="text-muted-foreground">
                  Hasta {planLimits.max_grupos === 999999 ? "ilimitados" : planLimits.max_grupos}
                </p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="font-medium">Estudiantes/grupo</p>
                <p className="text-muted-foreground">
                  Hasta {planLimits.max_estudiantes_por_grupo === 999999 ? "ilimitados" : planLimits.max_estudiantes_por_grupo}
                </p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="font-medium">Informes avanzados</p>
                <p className="text-muted-foreground">{planLimits.informes_avanzados ? "✅ Incluido" : "❌ No incluido"}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="font-medium">Comentarios IA</p>
                <p className="text-muted-foreground">{planLimits.comentarios_ia ? "✅ Incluido" : "❌ No incluido"}</p>
              </div>
            </div>
            {profile?.plan === "free" && (
              <Button className="w-full mt-4 gap-2" size="lg">
                <Crown className="h-4 w-4" /> Mejorar a Premium
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
