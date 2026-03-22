import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, ArrowRight, CheckCircle2, XCircle, Loader2 } from "lucide-react";

interface ClaseInfo {
  id: string;
  materia_nombre: string;
  materia_color: string | null;
  grupo_nombre: string;
}

interface PlanStats {
  total: number;
  completado: number;
  suspendido: number;
}

export default function Planificacion() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clases, setClases] = useState<ClaseInfo[]>([]);
  const [statsMap, setStatsMap] = useState<Record<string, PlanStats>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const [clasesRes, planRes] = await Promise.all([
        supabase
          .from("clases")
          .select("id, materia_id, grupo_id, materias(nombre, color), grupos(nombre)")
          .eq("user_id", user.id),
        supabase
          .from("planificacion_clases")
          .select("clase_id, estado, notas")
          .eq("user_id", user.id),
      ]);

      if (clasesRes.data) {
        setClases(
          clasesRes.data.map((c: any) => ({
            id: c.id,
            materia_nombre: c.materias?.nombre ?? "Sin materia",
            materia_color: c.materias?.color,
            grupo_nombre: c.grupos?.nombre ?? "Sin grupo",
          }))
        );
      }

      if (planRes.data) {
        // New format: each row = 1 subtema
        // Completado is derived from notas JSON or estado field
        const map: Record<string, PlanStats> = {};
        for (const row of planRes.data as any[]) {
          if (!map[row.clase_id]) {
            map[row.clase_id] = { total: 0, completado: 0, suspendido: 0 };
          }
          const s = map[row.clase_id];

          if (row.estado === "suspendido") {
            s.suspendido++;
            continue;
          }

          s.total++;

          // Check completion from notas JSON or estado
          let isCompleted = row.estado === "completado";
          if (!isCompleted && row.notas) {
            try {
              const parsed = JSON.parse(row.notas);
              // New format: {subtema, completado}
              if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                isCompleted = !!parsed.completado;
              }
              // Old format fallback: array of subtemas
              else if (Array.isArray(parsed) && parsed.length > 0) {
                if (typeof parsed[0] === "object" && "completado" in parsed[0]) {
                  // Old format with multiple subtemas — count each
                  s.total += parsed.length - 1; // already counted 1
                  s.completado += parsed.filter((st: any) => st.completado).length;
                  continue;
                }
              }
            } catch {}
          }

          if (isCompleted) s.completado++;
        }
        setStatsMap(map);
      }

      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (clases.length === 0) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-display font-bold">Planificación</h1>
        <Card className="border-dashed">
          <CardContent className="p-8 text-center space-y-3">
            <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No hay clases creadas aún.</p>
            <p className="text-xs text-muted-foreground">Creá una clase para comenzar a planificar.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-display font-bold">Planificación</h1>
      <div className="grid gap-4">
        {clases.map((clase) => {
          const stats = statsMap[clase.id];
          const hasPlanning = stats && (stats.total > 0 || stats.suspendido > 0);
          const pct = stats && stats.total > 0 ? Math.round((stats.completado / stats.total) * 100) : 0;

          return (
            <Card key={clase.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">
                    {clase.materia_nombre} · {clase.grupo_nombre}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-primary"
                    onClick={() => navigate(`/clase/${clase.id}`)}
                  >
                    Ir a clase <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {hasPlanning ? (
                  <>
                    <div className="flex items-center gap-3">
                      <Progress value={pct} className="flex-1 h-2.5" />
                      <span className="text-sm font-medium text-muted-foreground w-12 text-right">{pct}%</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <Badge variant="outline" className="gap-1 border-success/30 text-success">
                        <CheckCircle2 className="h-3 w-3" /> {stats.completado}/{stats.total} subtemas
                      </Badge>
                      {stats.suspendido > 0 && (
                        <Badge variant="outline" className="gap-1 border-destructive/30 text-destructive">
                          <XCircle className="h-3 w-3" /> {stats.suspendido} suspendidos
                        </Badge>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin programa cargado</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
