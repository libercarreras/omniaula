import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface InvitarDocenteProps {
  open: boolean;
  onClose: () => void;
  grupoId: string;
  grupoNombre: string;
}

export function InvitarDocente({ open, onClose, grupoId, grupoNombre }: InvitarDocenteProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleInvitar = async () => {
    if (!email.trim() || !user) return;
    setLoading(true);

    try {
      // Search for the docente by email
      const { data: profiles, error: searchError } = await supabase
        .from("profiles")
        .select("user_id, nombre, email")
        .eq("email", email.trim().toLowerCase())
        .neq("user_id", user.id);

      if (searchError) throw searchError;
      if (!profiles || profiles.length === 0) {
        toast.error("No se encontró un docente con ese correo electrónico");
        setLoading(false);
        return;
      }

      const target = profiles[0];

      // Check if already invited
      const { data: existing } = await supabase
        .from("grupo_colaboradores")
        .select("id")
        .eq("grupo_id", grupoId)
        .eq("colaborador_user_id", target.user_id);

      if (existing && existing.length > 0) {
        toast.error("Este docente ya fue invitado a este grupo");
        setLoading(false);
        return;
      }

      // Create invitation
      const { error: insertError } = await supabase
        .from("grupo_colaboradores")
        .insert({
          grupo_id: grupoId,
          owner_user_id: user.id,
          colaborador_user_id: target.user_id,
          estado: "pendiente",
        });

      if (insertError) throw insertError;

      toast.success(`Invitación enviada a ${target.nombre || target.email}`);
      setEmail("");
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error("Error al enviar la invitación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" /> Invitar docente
          </DialogTitle>
          <DialogDescription>
            Invitar a un docente a colaborar en el grupo <strong>{grupoNombre}</strong>.
            Podrá ver los estudiantes y gestionar sus propias materias.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label htmlFor="email">Correo electrónico del docente</Label>
            <Input
              id="email"
              type="email"
              placeholder="docente@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleInvitar()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleInvitar} disabled={loading || !email.trim()} className="gap-1.5">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Enviar invitación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
