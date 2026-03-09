import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, UserPlus, Share2, Loader2, FolderOpen } from "lucide-react";
import { InvitarDocente } from "@/components/colaboracion/InvitarDocente";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface GrupoDB {
  id: string;
  nombre: string;
  anio: string | null;
  turno: string | null;
  studentCount?: number;
}

export default function Grupos() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [grupos, setGrupos] = useState<GrupoDB[]>([]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [selectedGrupo, setSelectedGrupo] = useState<{ id: string; nombre: string } | null>(null);
  const [sharedGrupoIds, setSharedGrupoIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const [gruposRes, estudiantesRes, sharedRes] = await Promise.all([
        supabase.from("grupos").select("*"),
        supabase.from("estudiantes").select("id, grupo_id"),
        supabase.from("grupo_colaboradores").select("grupo_id").eq("colaborador_user_id", user.id).eq("estado", "aceptada"),
      ]);

      const countMap: Record<string, number> = {};
      (estudiantesRes.data || []).forEach(e => {
        countMap[e.grupo_id] = (countMap[e.grupo_id] || 0) + 1;
      });

      const gruposWithCount = (gruposRes.data || []).map(g => ({
        ...g,
        studentCount: countMap[g.id] || 0,
      }));

      setGrupos(gruposWithCount);
      if (sharedRes.data) {
        setSharedGrupoIds(new Set(sharedRes.data.map(d => d.grupo_id)));
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Grupos</h1>
        <Button size="lg" className="gap-2">
          <Plus className="h-4 w-4" /> Nuevo grupo
        </Button>
      </div>

      {grupos.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-3">
            <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No tienes grupos creados aún.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {grupos.map((grupo) => {
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
                      {grupo.anio && <p className="text-sm text-muted-foreground mt-1">{grupo.anio} {grupo.turno ? `· ${grupo.turno}` : ""}</p>}
                    </div>
                    <div className="flex items-center gap-1 text-sm bg-muted rounded-full px-3 py-1">
                      <Users className="h-3.5 w-3.5" />
                      {grupo.studentCount}
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
      )}

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
