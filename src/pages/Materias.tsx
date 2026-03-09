import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, BookOpen, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function Materias() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [materias, setMaterias] = useState<any[]>([]);
  const [clases, setClases] = useState<any[]>([]);
  const [grupos, setGrupos] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      setLoading(true);
      const [matRes, clsRes, grpRes] = await Promise.all([
        supabase.from("materias").select("*"),
        supabase.from("clases").select("*"),
        supabase.from("grupos").select("id, nombre"),
      ]);
      setMaterias(matRes.data || []);
      setClases(clsRes.data || []);
      const map: Record<string, string> = {};
      (grpRes.data || []).forEach(g => { map[g.id] = g.nombre; });
      setGrupos(map);
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Materias</h1>
        <Button size="lg" className="gap-2"><Plus className="h-4 w-4" /> Nueva materia</Button>
      </div>

      {materias.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-3">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No tienes materias creadas aún.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {materias.map(materia => {
            const clasesMateria = clases.filter(c => c.materia_id === materia.id);
            return (
              <Card key={materia.id}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <h3 className="font-display font-bold text-lg">{materia.nombre}</h3>
                    <Badge variant="secondary">{clasesMateria.length} clases</Badge>
                  </div>
                  <div className="space-y-2">
                    {clasesMateria.map(clase => (
                      <div key={clase.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                          <p className="font-semibold">{grupos[clase.grupo_id] || "Sin grupo"}</p>
                          <p className="text-sm text-muted-foreground">{clase.horario || "Sin horario"}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{clase.aula}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
