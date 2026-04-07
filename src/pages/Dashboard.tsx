import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, AlertTriangle, ClipboardCheck, Users, Plus, Loader2, Clock, ArrowRight, CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useInstitucion } from "@/hooks/useInstitucion";
import { RadarRiesgo } from "@/components/radar/RadarRiesgo";
import { InvitacionesPendientes } from "@/components/colaboracion/InvitacionesPendientes";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";

interface ClaseWithRelations {
  id: string;
  materia_id: string;
  grupo_id: string;
  horario: string | null;
  aula: string | null;
}

const DIAS_MAP: Record<string, number> = {
  "domingo": 0, "lunes": 1, "martes": 2, "miercoles": 3, "miércoles": 3,
  "jueves": 4, "viernes": 5, "sabado": 6, "sábado": 6,
  "dom": 0, "lun": 1, "mar": 2, "mie": 3, "mié": 3,
  "jue": 4, "vie": 5, "sab": 6, "sáb": 6,
};

function parseHorarioDia(horario: string | null): { dia: number | null; hora: string } {
  if (!horario) return { dia: null, hora: "" };
  const lower = horario.toLowerCase().trim();
  for (const [key, val] of Object.entries(DIAS_MAP)) {
    if (lower.startsWith(key)) {
      const rest = lower.slice(key.length).trim();
      return { dia: val, hora: rest };
    }
  }
  return { dia: null, hora: horario };
}

const DIAS_NOMBRE = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

interface DashboardData {
  clases: ClaseWithRelations[];
  totalEstudiantes: number;
  totalEvaluaciones: number;
  materias: Record<string, string>;
  grupos: Record<string, string>;
  estudiantesPorGrupo: Record<string, number>;
  totalMaterias: number;
  totalGrupos: number;
}

const EMPTY_DATA: DashboardData = {
  clases: [], totalEstudiantes: 0, totalEvaluaciones: 0,
  materias: {}, grupos: {}, estudiantesPorGrupo: {}, totalMaterias: 0, totalGrupos: 0,
};

export default function Dashboard() {
  const { profile, user } = useAuth();
  const { institucionActiva } = useInstitucion();
  const nombre = profile?.nombre?.split(" ")[0] || "Profesor";

  const { data = EMPTY_DATA, isLoading } = useQuery({
    queryKey: qk.dashboard(institucionActiva?.id ?? ""),
    enabled: !!user && !!institucionActiva,
    queryFn: async (): Promise<DashboardData> => {
      try {
        const { data: gruposData, error: gruposError } = await supabase
          .from("grupos").select("id, nombre").eq("institucion_id", institucionActiva!.id);
        if (gruposError) throw gruposError;

        const grupoIds = (gruposData || []).map(g => g.id);
        const grpMap: Record<string, string> = {};
        (gruposData || []).forEach(g => { grpMap[g.id] = g.nombre; });

        if (grupoIds.length === 0) {
          return { ...EMPTY_DATA, grupos: grpMap };
        }

        const [clasesRes, materiasRes, estudiantesRes, evaluacionesRes] = await Promise.all([
          supabase.from("clases").select("*").in("grupo_id", grupoIds),
          supabase.from("materias").select("id, nombre"),
          supabase.from("estudiantes").select("id, grupo_id").in("grupo_id", grupoIds),
          supabase.from("evaluaciones").select("id, clase_id"),
        ]);

        const matMap: Record<string, string> = {};
        (materiasRes.data || []).forEach(m => { matMap[m.id] = m.nombre; });

        const epg: Record<string, number> = {};
        (estudiantesRes.data || []).forEach(e => { epg[e.grupo_id] = (epg[e.grupo_id] || 0) + 1; });

        const clasesInst = clasesRes.data || [];
        const claseIds = new Set(clasesInst.map(c => c.id));
        const evsFiltered = (evaluacionesRes.data || []).filter(e => claseIds.has(e.clase_id));

        return {
          clases: clasesInst,
          totalEstudiantes: (estudiantesRes.data || []).length,
          totalEvaluaciones: evsFiltered.length,
          materias: matMap,
          grupos: grpMap,
          estudiantesPorGrupo: epg,
          totalMaterias: (materiasRes.data || []).length,
          totalGrupos: grupoIds.length,
        };
      } catch (err) {
        console.error("[OmniAula][Dashboard] queryFn error:", err);
        return EMPTY_DATA;
      }
    },
  });

  const { clases, totalEstudiantes, totalEvaluaciones, materias, grupos, estudiantesPorGrupo, totalMaterias, totalGrupos } = data;

  const getClaseLabel = (clase: ClaseWithRelations) =>
    `${materias[clase.materia_id] || "?"} - ${grupos[clase.grupo_id] || "?"}`;

  const hoy = new Date().toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const diaHoy = new Date().getDay();

  const { clasesHoy, clasesManana, clasesOtras } = useMemo(() => {
    const hoyList: ClaseWithRelations[] = [];
    const mananaList: ClaseWithRelations[] = [];
    const otrasList: ClaseWithRelations[] = [];
    const diaManana = (diaHoy + 1) % 7;

    clases.forEach(c => {
      const { dia } = parseHorarioDia(c.horario);
      if (dia === diaHoy) hoyList.push(c);
      else if (dia === diaManana) mananaList.push(c);
      else otrasList.push(c);
    });
    const sortByHora = (a: ClaseWithRelations, b: ClaseWithRelations) => {
      const ha = parseHorarioDia(a.horario).hora;
      const hb = parseHorarioDia(b.horario).hora;
      return ha.localeCompare(hb);
    };
    hoyList.sort(sortByHora);
    mananaList.sort(sortByHora);
    return { clasesHoy: hoyList, clasesManana: mananaList, clasesOtras: otrasList };
  }, [clases, diaHoy]);

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[50vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const isNewUser = totalMaterias === 0 && totalGrupos === 0;
  const hasClases = clases.length > 0;

  const ClaseCard = ({ clase, prominent = false }: { clase: ClaseWithRelations; prominent?: boolean }) => (
    <Card className={prominent ? "border-primary/30 bg-primary/5 hover:shadow-md transition-shadow" : "hover:shadow-md transition-shadow"}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className={prominent ? "font-bold text-lg" : "font-bold"}>{getClaseLabel(clase)}</p>
            <div className="flex items-center gap-2 mt-1">
              {clase.horario && <Badge variant="secondary" className="text-xs">{clase.horario}</Badge>}
              {clase.aula && <span className="text-xs text-muted-foreground">{clase.aula}</span>}
              <span className="text-xs text-muted-foreground">{estudiantesPorGrupo[clase.grupo_id] || 0} estudiantes</span>
            </div>
          </div>
          <Link to={`/clase/${clase.id}`}>
            <Button size={prominent ? "default" : "sm"} className="gap-1.5 shrink-0">
              <ArrowRight className="h-4 w-4" /> {prominent ? "Iniciar clase" : "Ir"}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );

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
                <span className="text-2xl font-bold text-destructive">0</span>
                <span className="text-xs text-muted-foreground">En riesgo</span>
              </CardContent>
            </Card>
          </div>

          {/* Clases de hoy */}
          {clasesHoy.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" /> Clases de hoy
              </h2>
              <div className="space-y-3">
                {clasesHoy.map((clase) => (
                  <ClaseCard key={clase.id} clase={clase} prominent />
                ))}
              </div>
            </div>
          )}

          {/* Si no hay clases hoy, mostrar próximas */}
          {clasesHoy.length === 0 && clasesManana.length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-lg mb-3 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-muted-foreground" /> Próximas clases — {DIAS_NOMBRE[(diaHoy + 1) % 7]}
              </h2>
              <div className="space-y-3">
                {clasesManana.map((clase) => (
                  <ClaseCard key={clase.id} clase={clase} />
                ))}
              </div>
            </div>
          )}

          <RadarRiesgo />

          {/* Todas las clases */}
          {(clasesHoy.length > 0 ? clasesOtras : [...clasesManana.length > 0 ? clasesOtras : clases]).length > 0 && (
            <div>
              <h2 className="font-display font-semibold text-lg mb-3">
                {clasesHoy.length > 0 || clasesManana.length > 0 ? "Otras clases" : "Acceso rápido"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(clasesHoy.length > 0 ? clasesOtras : clasesManana.length > 0 ? clasesOtras : clases).map((clase) => (
                  <ClaseCard key={clase.id} clase={clase} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
