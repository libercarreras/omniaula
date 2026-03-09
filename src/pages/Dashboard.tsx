import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, AlertTriangle, ClipboardCheck, Users, Plus, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useInstitucion } from "@/hooks/useInstitucion";
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
}

export default function Dashboard() {
  const { profile, user } = useAuth();
  const { institucionActiva } = useInstitucion();
  const nombre = profile?.nombre?.split(" ")[0] || "Profesor";
  const [loading, setLoading] = useState(true);
  const [clases, setClases] = useState<ClaseWithRelations[]>([]);
  const [totalEstudiantes, setTotalEstudiantes] = useState(0);
  const [totalEvaluaciones, setTotalEvaluaciones] = useState(0);
  const [estudiantesEnRiesgo] = useState(0);
  const [materias, setMaterias] = useState<Record<string, string>>({});
  const [grupos, setGrupos] = useState<Record<string, string>>({});
  const [totalMaterias, setTotalMaterias] = useState(0);
  const [totalGrupos, setTotalGrupos] = useState(0);

  useEffect(() => {
    if (!user || !institucionActiva) { setLoading(false); return; }
    const fetchData = async () => {
      setLoading(true);
      // Get grupos for active institution
      const { data: gruposData } = await supabase
        .from("grupos").select("id, nombre").eq("institucion_id", institucionActiva.id);
      const grupoIds = (gruposData || []).map(g => g.id);
      const grpMap: Record<string, string> = {};
      (gruposData || []).forEach(g => { grpMap[g.id] = g.nombre; });
      setGrupos(grpMap);
      setTotalGrupos(grupoIds.length);

      if (grupoIds.length === 0) {
        setClases([]); setTotalEstudiantes(0); setTotalEvaluaciones(0);
        setMaterias({});
        setLoading(false);
        return;
      }

      const [clasesRes, materiasRes, estudiantesRes, evaluacionesRes] = await Promise.all([
        supabase.from("clases").select("*").in("grupo_id", grupoIds),
        supabase.from("materias").select("id, nombre"),
        supabase.from("estudiantes").select("id").in("grupo_id", grupoIds),
        supabase.from("evaluaciones").select("id, clase_id"),
      ]);

      const matMap: Record<string, string> = {};
      (materiasRes.data || []).forEach(m => { matMap[m.id] = m.nombre; });
      setMaterias(matMap);
      setTotalMaterias((materiasRes.data || []).length);

      const clasesInst = clasesRes.data || [];
      setClases(clasesInst);
      setTotalEstudiantes((estudiantesRes.data || []).length);

      const claseIds = new Set(clasesInst.map(c => c.id));
      const evsFiltered = (evaluacionesRes.data || []).filter(e => claseIds.has(e.clase_id));
      setTotalEvaluaciones(evsFiltered.length);
      setLoading(false);
    };
    fetchData();
  }, [user, institucionActiva]);

  const getClaseLabel = (clase: ClaseWithRelations) =>
    `${materias[clase.materia_id] || "?"} - ${grupos[clase.grupo_id] || "?"}`;

  const hoy = new Date().toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  if (loading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const isNewUser = totalMaterias === 0 && totalGrupos === 0;
  const hasMateriasOrGrupos = totalMaterias > 0 || totalGrupos > 0;
  const hasClases = clases.length > 0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold">Buenos días, {nombre}</h1>
        <p className="text-muted-foreground capitalize">{hoy}</p>
        {institucionActiva && (
          <p className="text-sm text-primary font-medium mt-1">{institucionActiva.nombre}</p>
        )}
      </div>

      <InvitacionesPendientes />

      {isNewUser ? (
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
      ) : !hasClases ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <BookOpen className="h-6 w-6 text-primary mb-1" />
                <span className="text-2xl font-bold text-primary">{totalMaterias}</span>
                <span className="text-xs text-muted-foreground">Materias</span>
              </CardContent>
            </Card>
            <Card className="bg-accent/5 border-accent/20">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <Users className="h-6 w-6 text-accent mb-1" />
                <span className="text-2xl font-bold text-accent">{totalGrupos}</span>
                <span className="text-xs text-muted-foreground">Grupos</span>
              </CardContent>
            </Card>
            <Card className="bg-muted/5 border-muted/20">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <ClipboardCheck className="h-6 w-6 text-muted-foreground mb-1" />
                <span className="text-2xl font-bold text-muted-foreground">{totalEstudiantes}</span>
                <span className="text-xs text-muted-foreground">Estudiantes</span>
              </CardContent>
            </Card>
            <Card className="bg-muted/5 border-muted/20">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <Users className="h-6 w-6 text-muted-foreground mb-1" />
                <span className="text-2xl font-bold text-muted-foreground">0</span>
                <span className="text-xs text-muted-foreground">Clases</span>
              </CardContent>
            </Card>
          </div>
          <Card className="border-dashed">
            <CardContent className="p-8 text-center space-y-4">
              <ClipboardCheck className="h-12 w-12 text-primary mx-auto" />
              <div>
                <h2 className="text-lg font-semibold">Ya tenés materias y grupos</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Ahora creá una clase para vincular una materia con un grupo y empezar a trabajar.
                </p>
              </div>
              <Link to="/grupos">
                <Button className="gap-2"><Plus className="h-4 w-4" /> Crear clase</Button>
              </Link>
            </CardContent>
          </Card>
        </>
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
