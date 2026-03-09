import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UserX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface EstudianteDB {
  id: string;
  nombre_completo: string;
  grupo_id: string;
  numero_lista: number | null;
}

interface GrupoDB {
  id: string;
  nombre: string;
}

export default function Estudiantes() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [estudiantes, setEstudiantes] = useState<EstudianteDB[]>([]);
  const [grupos, setGrupos] = useState<GrupoDB[]>([]);
  const [filtroGrupo, setFiltroGrupo] = useState("todos");

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const [estRes, grpRes] = await Promise.all([
        supabase.from("estudiantes").select("id, nombre_completo, grupo_id, numero_lista"),
        supabase.from("grupos").select("id, nombre"),
      ]);
      setEstudiantes(estRes.data || []);
      setGrupos(grpRes.data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const filtered = filtroGrupo === "todos" ? estudiantes : estudiantes.filter(e => e.grupo_id === filtroGrupo);
  const grupoMap = Object.fromEntries(grupos.map(g => [g.id, g.nombre]));

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-display font-bold">Estudiantes</h1>
        <Select value={filtroGrupo} onValueChange={setFiltroGrupo}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Filtrar grupo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {grupos.map(g => <SelectItem key={g.id} value={g.id}>{g.nombre}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-3">
            <UserX className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No hay estudiantes registrados.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(est => (
            <Card key={est.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{est.nombre_completo}</p>
                  <p className="text-sm text-muted-foreground">{grupoMap[est.grupo_id] || "Sin grupo"}</p>
                </div>
                {est.numero_lista && <span className="text-xs text-muted-foreground">#{est.numero_lista}</span>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
