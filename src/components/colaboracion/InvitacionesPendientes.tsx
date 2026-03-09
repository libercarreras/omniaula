import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Mail, Check, X } from "lucide-react";

interface Invitacion {
  id: string;
  grupo_id: string;
  owner_user_id: string;
  estado: string;
  created_at: string;
  grupo_nombre?: string;
  owner_nombre?: string;
}

export function InvitacionesPendientes() {
  const { user } = useAuth();
  const [invitaciones, setInvitaciones] = useState<Invitacion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvitaciones = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("grupo_colaboradores")
        .select("id, grupo_id, owner_user_id, estado, created_at")
        .eq("colaborador_user_id", user.id)
        .eq("estado", "pendiente");

      if (error) throw error;
      if (!data || data.length === 0) {
        setInvitaciones([]);
        setLoading(false);
        return;
      }

      // Fetch grupo names and owner names
      const grupoIds = [...new Set(data.map((d) => d.grupo_id))];
      const ownerIds = [...new Set(data.map((d) => d.owner_user_id))];

      const [gruposRes, profilesRes] = await Promise.all([
        supabase.from("grupos").select("id, nombre").in("id", grupoIds),
        supabase.from("profiles").select("user_id, nombre").in("user_id", ownerIds),
      ]);

      const grupoMap = Object.fromEntries((gruposRes.data || []).map((g) => [g.id, g.nombre]));
      const profileMap = Object.fromEntries((profilesRes.data || []).map((p) => [p.user_id, p.nombre]));

      setInvitaciones(
        data.map((inv) => ({
          ...inv,
          grupo_nombre: grupoMap[inv.grupo_id] || "Grupo",
          owner_nombre: profileMap[inv.owner_user_id] || "Docente",
        }))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitaciones();
  }, [user]);

  const responder = async (invId: string, estado: "aceptada" | "rechazada") => {
    try {
      const { error } = await supabase
        .from("grupo_colaboradores")
        .update({ estado })
        .eq("id", invId);

      if (error) throw error;
      toast.success(estado === "aceptada" ? "Invitación aceptada" : "Invitación rechazada");
      fetchInvitaciones();
    } catch {
      toast.error("Error al responder la invitación");
    }
  };

  if (loading || invitaciones.length === 0) return null;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          Invitaciones pendientes
          <Badge variant="secondary" className="ml-auto">{invitaciones.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {invitaciones.map((inv) => (
          <div
            key={inv.id}
            className="flex items-center justify-between p-3 rounded-lg bg-background border"
          >
            <div>
              <p className="text-sm font-medium">{inv.owner_nombre} te invitó a</p>
              <p className="text-sm text-primary font-semibold">{inv.grupo_nombre}</p>
            </div>
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10"
                onClick={() => responder(inv.id, "rechazada")}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                className="h-9 w-9 p-0 bg-success hover:bg-success/90"
                onClick={() => responder(inv.id, "aceptada")}
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
