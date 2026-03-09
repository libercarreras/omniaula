import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, UserPlus, Share2 } from "lucide-react";
import { grupos, clases, materias } from "@/data/mockData";
import { InvitarDocente } from "@/components/colaboracion/InvitarDocente";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function Grupos() {
  const { user } = useAuth();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [selectedGrupo, setSelectedGrupo] = useState<{ id: string; nombre: string } | null>(null);
  const [sharedGrupoIds, setSharedGrupoIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    const fetchShared = async () => {
      const { data } = await supabase
        .from("grupo_colaboradores")
        .select("grupo_id")
        .eq("colaborador_user_id", user.id)
        .eq("estado", "aceptada");
      if (data) {
        setSharedGrupoIds(new Set(data.map((d) => d.grupo_id)));
      }
    };
    fetchShared();
  }, [user]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Grupos</h1>
        <Button size="lg" className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo grupo
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {grupos.map((grupo) => {
          const clasesGrupo = clases.filter((c) => c.grupoId === grupo.id);
          const isShared = sharedGrupoIds.has(grupo.id);
          return (
            <Card key={grupo.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-xl">{grupo.nombre}</h3>
                      {isShared && (
                        <Badge variant="secondary" className="text-[10px] gap-1">
                          <Share2 className="h-3 w-3" /> Compartido
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {clasesGrupo.map((c) => materias.find((m) => m.id === c.materiaId)?.nombre).join(", ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-sm bg-muted rounded-full px-3 py-1">
                    <Users className="h-3.5 w-3.5" />
                    {grupo.cantidadEstudiantes}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => {
                      setSelectedGrupo({ id: grupo.id, nombre: grupo.nombre });
                      setInviteOpen(true);
                    }}
                  >
                    <UserPlus className="h-3.5 w-3.5" /> Invitar docente
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedGrupo && (
        <InvitarDocente
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
          grupoId={selectedGrupo.id}
          grupoNombre={selectedGrupo.nombre}
        />
      )}
    </div>
  );
}
