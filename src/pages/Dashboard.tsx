import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, AlertTriangle, ClipboardCheck, Clock, Users } from "lucide-react";
import { clasesDelDia, evaluaciones, estudiantes, actividadReciente, grupos } from "@/data/mockData";
import { Link } from "react-router-dom";

const estudiantesEnRiesgo = estudiantes.filter((e) => e.enRiesgo);
const proximasEvaluaciones = evaluaciones.slice(0, 3);

export default function Dashboard() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold">Buenos días, Profesor</h1>
        <p className="text-muted-foreground">Lunes 9 de marzo, 2026</p>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <Users className="h-6 w-6 text-primary mb-1" />
            <span className="text-2xl font-bold text-primary">{grupos.length}</span>
            <span className="text-xs text-muted-foreground">Grupos</span>
          </CardContent>
        </Card>
        <Card className="bg-accent/5 border-accent/20">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <BookOpen className="h-6 w-6 text-accent mb-1" />
            <span className="text-2xl font-bold text-accent">{clasesDelDia.length}</span>
            <span className="text-xs text-muted-foreground">Clases hoy</span>
          </CardContent>
        </Card>
        <Card className="bg-warning/5 border-warning/20">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <ClipboardCheck className="h-6 w-6 text-warning mb-1" />
            <span className="text-2xl font-bold text-warning">{proximasEvaluaciones.length}</span>
            <span className="text-xs text-muted-foreground">Evaluaciones</span>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5 border-destructive/20">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <AlertTriangle className="h-6 w-6 text-destructive mb-1" />
            <span className="text-2xl font-bold text-destructive">{estudiantesEnRiesgo.length}</span>
            <span className="text-xs text-muted-foreground">En riesgo</span>
          </CardContent>
        </Card>
      </div>

      {/* Clases del día */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Clases del día
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {clasesDelDia.map((clase, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="font-semibold">{clase.grupo} — {clase.materia}</p>
                <p className="text-sm text-muted-foreground">{clase.aula}</p>
              </div>
              <span className="text-sm font-medium text-primary">{clase.horario}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Accesos rápidos a grupos */}
      <div>
        <h2 className="font-display font-semibold text-lg mb-3">Acceso rápido</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {grupos.map((grupo) => (
            <Link key={grupo.id} to="/grupos">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <p className="font-bold text-lg">{grupo.nombre}</p>
                  <p className="text-sm text-muted-foreground">{grupo.materia}</p>
                  <p className="text-xs text-muted-foreground mt-1">{grupo.cantidadEstudiantes} estudiantes</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Actividad reciente */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Actividad reciente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {actividadReciente.map((act, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
              <span className="text-sm">{act.texto}</span>
              <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{act.tiempo}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
