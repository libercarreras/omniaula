import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Users, PieChart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart as RePieChart, Pie, Cell,
} from "recharts";

interface Props {
  claseId: string;
  grupoId: string;
}

const COLORS = ["hsl(var(--destructive))", "hsl(var(--chart-4))", "hsl(var(--chart-2))", "hsl(var(--chart-1))", "hsl(var(--primary))"];

export function RendimientoCharts({ claseId, grupoId }: Props) {
  const [promedios, setPromedios] = useState<{ nombre: string; promedio: number }[]>([]);
  const [distribucion, setDistribucion] = useState<{ rango: string; cantidad: number }[]>([]);
  const [asistSemanal, setAsistSemanal] = useState<{ semana: string; porcentaje: number }[]>([]);
  const [resumen, setResumen] = useState({ totalEst: 0, promedioGral: 0, asistGral: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!claseId || !grupoId) return;
    const load = async () => {
      setLoading(true);

      // Get students
      const { data: estudiantes } = await supabase.from("estudiantes").select("id").eq("grupo_id", grupoId);
      const estIds = (estudiantes || []).map(e => e.id);

      // Get evaluaciones
      const { data: evals } = await supabase.from("evaluaciones").select("id, nombre").eq("clase_id", claseId).order("fecha", { ascending: true });
      const evalIds = (evals || []).map(e => e.id);

      let notasData: any[] = [];
      if (evalIds.length > 0 && estIds.length > 0) {
        const { data } = await supabase.from("notas").select("evaluacion_id, nota, estudiante_id").in("evaluacion_id", evalIds);
        notasData = data || [];
      }

      // Promedios por evaluación
      const promPorEval = (evals || []).map(ev => {
        const notas = notasData.filter(n => n.evaluacion_id === ev.id && n.nota !== null);
        const avg = notas.length > 0 ? notas.reduce((s, n) => s + Number(n.nota), 0) / notas.length : 0;
        return { nombre: ev.nombre.length > 15 ? ev.nombre.substring(0, 15) + "…" : ev.nombre, promedio: Math.round(avg * 10) / 10 };
      }).filter(p => p.promedio > 0);
      setPromedios(promPorEval);

      // Distribución de notas
      const allNotas = notasData.filter(n => n.nota !== null).map(n => Number(n.nota));
      const dist = [
        { rango: "0-3", cantidad: allNotas.filter(n => n <= 3).length },
        { rango: "4-5", cantidad: allNotas.filter(n => n >= 4 && n <= 5).length },
        { rango: "6-7", cantidad: allNotas.filter(n => n >= 6 && n <= 7).length },
        { rango: "8-9", cantidad: allNotas.filter(n => n >= 8 && n <= 9).length },
        { rango: "10", cantidad: allNotas.filter(n => n >= 10).length },
      ];
      setDistribucion(dist);

      // Promedio general
      const promedioGral = allNotas.length > 0 ? Math.round((allNotas.reduce((a, b) => a + b, 0) / allNotas.length) * 10) / 10 : 0;

      // Asistencia semanal (últimas 6 semanas)
      const { data: asistData } = await supabase.from("asistencia").select("fecha, estado").eq("clase_id", claseId).order("fecha", { ascending: true });
      const asist = asistData || [];

      const weeks: { semana: string; porcentaje: number }[] = [];
      if (asist.length > 0) {
        const now = new Date();
        for (let w = 5; w >= 0; w--) {
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - (w + 1) * 7);
          const weekEnd = new Date(now);
          weekEnd.setDate(now.getDate() - w * 7);
          const weekAsist = asist.filter(a => {
            const d = new Date(a.fecha);
            return d >= weekStart && d < weekEnd;
          });
          if (weekAsist.length > 0) {
            const presentes = weekAsist.filter(a => a.estado === "presente" || a.estado === "tarde").length;
            weeks.push({ semana: `Sem ${6 - w}`, porcentaje: Math.round((presentes / weekAsist.length) * 100) });
          }
        }
      }
      setAsistSemanal(weeks);

      // Asistencia general
      const totalAsist = asist.length;
      const presentesTotal = asist.filter(a => a.estado === "presente" || a.estado === "tarde").length;
      const asistGral = totalAsist > 0 ? Math.round((presentesTotal / totalAsist) * 100) : 0;

      setResumen({ totalEst: estIds.length, promedioGral, asistGral });
      setLoading(false);
    };
    load();
  }, [claseId, grupoId]);

  if (loading) return <div className="flex justify-center py-8"><BarChart3 className="h-6 w-6 animate-pulse text-muted-foreground" /></div>;

  const hasData = promedios.length > 0 || asistSemanal.length > 0;

  if (!hasData) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">Registra evaluaciones y asistencia para ver gráficos de rendimiento.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold">{resumen.totalEst}</p>
            <p className="text-xs text-muted-foreground">Estudiantes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold">{resumen.promedioGral || "—"}</p>
            <p className="text-xs text-muted-foreground">Promedio</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <PieChart className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
            <p className="text-2xl font-bold">{resumen.asistGral ? `${resumen.asistGral}%` : "—"}</p>
            <p className="text-xs text-muted-foreground">Asistencia</p>
          </CardContent>
        </Card>
      </div>

      {/* Promedios por evaluación */}
      {promedios.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Promedio por evaluación</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={promedios}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="nombre" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip />
                <Bar dataKey="promedio" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Distribución de notas */}
      {distribucion.some(d => d.cantidad > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Distribución de notas</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={distribucion}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="rango" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip />
                <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
                  {distribucion.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Asistencia semanal */}
      {asistSemanal.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Asistencia semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={asistSemanal}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="semana" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Line type="monotone" dataKey="porcentaje" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
