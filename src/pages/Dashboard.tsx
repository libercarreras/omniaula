import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, AlertTriangle, ClipboardCheck, Clock, Users, Plus, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { RadarRiesgo } from "@/components/radar/RadarRiesgo";
import { InvitacionesPendientes } from "@/components/colaboracion/InvitacionesPendientes";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface ClaseWithRelations {
  id: string;
  materia_id: string;
  grupo_id: string;
  horario: string | null;
  aula: string | null;
  materia_nombre?: string;
  grupo_nombre?: string;
}

export default function Dashboard() {
  const { profile, user } = useAuth();
  const nombre = profile?.nombre?.split(" ")[0] || "Profesor";
  const [loading, setLoading] = useState(true);
  const [clases, setClases] = useState<ClaseWithRelations[]>([]);
  const [totalEstudiantes, setTotalEstudiantes] = useState(0);
  const [totalEvaluaciones, setTotalEvaluaciones] = useState(0);
  const [estudiantesEnRiesgo, setEstudiantesEnRiesgo] = useState(0);
  const [materias, setMaterias] = useState<Record<string, string>>({});
  const [grupos, setGrupos] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const [clasesRes, materiasRes, gruposRes, estudiantesRes, evaluacionesRes] = await Promise.all([
        supabase.from("clases").select("*"),
        supabase.from("materias").select("id, nombre"),
        supabase.from("grupos").select("id, nombre"),
        supabase.from("estudiantes").select("id"),
        supabase.from("evaluaciones").select("id"),
      ]);

      const matMap: Record<string, string> = {};
      (materiasRes.data || []).forEach(m => { matMap[m.id] = m.nombre; });
      setMaterias(matMap);

      const grpMap: Record<string, string> = {};
      (gruposRes.data || []).forEach(g => { grpMap[g.id] = g.nombre; });
      setGrupos(grpMap);

      setClases(clasesRes.data || []);
      setTotalEstudiantes((estudiantesRes.data || []).length);
      setTotalEvaluaciones((evaluacionesRes.data || []).length);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const getClaseLabel = (clase: ClaseWithRelations) =>
    `${materias[clase.materia_id] || "?"} - ${grupos[clase.grupo_id] || "?"}`;

  const hoy = new Date().toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const hasData = clases.length > 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold">Buenos días, {nombre}</h1>
        <p className="text-muted-foreground capitalize">{hoy}</p>
      </div>

      <InvitacionesPendientes />

      {!hasData ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-4">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h2 className="text-lg font-semibold">¡Bienvenido a OmniAula!</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Comienza creando tu primera materia y grupo para empezar a usar la plataforma.
              </p>
            </div>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link to="/materias">
                <Button className="gap-2"><Plus className="h-4 w-4" /> Crear materia</Button>
              </Link>
              <Link to="/grupos">
                <Button variant="outline" className="gap-2"><Plus className="h-4 w-4" /> Crear grupo</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <Users className="h-6 w-6 text-primary mb-1" />
                <span className="text-2xl font-bold text-primary">{clases.length}</span>
                <span className="text-xs text-muted-foreground">Clases</span>
              </CardContent>
            </Card>
            <Card className="bg-accent/5 border-accent/20">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <BookOpen className="h-6 w-6 text-accent mb-1" />
                <span className="text-2xl font-bold text-accent">{totalEstudiantes}</span>
                <span className="text-xs text-muted-foreground">Estudiantes</span>
              </CardContent>
            </Card>
            <Card className="bg-warning/5 border-warning/20">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <ClipboardCheck className="h-6 w-6 text-warning mb-1" />
                <span className="text-2xl font-bold text-warning">{totalEvaluaciones}</span>
                <span className="text-xs text-muted-foreground">Evaluaciones</span>
              </CardContent>
            </Card>
            <Card className="bg-destructive/5 border-destructive/20">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <AlertTriangle className="h-6 w-6 text-destructive mb-1" />
                <span className="text-2xl font-bold text-destructive">{estudiantesEnRiesgo}</span>
                <span className="text-xs text-muted-foreground">En riesgo</span>
              </CardContent>
            </Card>
          </div>

          <RadarRiesgo />

          <div>
            <h2 className="font-display font-semibold text-lg mb-3">Acceso rápido</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {clases.map((clase) => (
                <Link key={clase.id} to={`/clase/${clase.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <p className="font-bold text-lg">{getClaseLabel(clase)}</p>
                      <p className="text-sm text-muted-foreground">{clase.horario || "Sin horario"}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
