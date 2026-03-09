import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Area, AreaChart, Cell,
} from "recharts";
import {
  TrendingUp, TrendingDown, Users, AlertTriangle, Award,
  UserCheck, BarChart3,
} from "lucide-react";
import { clases, getClaseLabel } from "@/data/mockData";
import {
  mockPromediosPorEvaluacion, mockDistribucionNotas,
  mockAsistenciaSemanal, mockTendenciaPromedio,
  mockEstudiantesEnRiesgo, mockGrupoReporte,
} from "@/data/mockAnalytics";
import { useState } from "react";
import { AIGroupAnalysis } from "@/components/analisis/AIGroupAnalysis";

const NOTA_COLORS = ["hsl(0, 72%, 55%)", "hsl(38, 92%, 50%)", "hsl(217, 72%, 45%)", "hsl(152, 55%, 42%)", "hsl(152, 55%, 32%)"];

export default function Analisis() {
  const [claseSeleccionada, setClaseSeleccionada] = useState(clases[0].id);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-display font-bold">Análisis</h1>
        <Select value={claseSeleccionada} onValueChange={setClaseSeleccionada}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {clases.map((c) => (
              <SelectItem key={c.id} value={c.id}>{getClaseLabel(c.id)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* AI Analysis Button */}
      <AIGroupAnalysis claseLabel={getClaseLabel(claseSeleccionada)} />

      <Tabs defaultValue="rendimiento" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="rendimiento">Rendimiento</TabsTrigger>
          <TabsTrigger value="riesgo">En riesgo</TabsTrigger>
          <TabsTrigger value="tendencias">Tendencias</TabsTrigger>
        </TabsList>

        {/* ---- TAB: Rendimiento ---- */}
        <TabsContent value="rendimiento" className="space-y-6 mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard icon={BarChart3} value={mockGrupoReporte.promedioGeneral} label="Promedio general" color="text-primary" />
            <SummaryCard icon={UserCheck} value={`${mockGrupoReporte.asistenciaPromedio}%`} label="Asistencia" color="text-success" />
            <SummaryCard icon={Award} value={mockGrupoReporte.altoRendimiento} label="Alto rendimiento" color="text-accent" />
            <SummaryCard icon={AlertTriangle} value={mockGrupoReporte.bajoRendimiento} label="Bajo rendimiento" color="text-destructive" />
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Distribución de notas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockDistribucionNotas}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 25%, 89%)" />
                    <XAxis dataKey="rango" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: "0.5rem", border: "1px solid hsl(214, 25%, 89%)", fontSize: "0.875rem" }} />
                    <Bar dataKey="cantidad" radius={[6, 6, 0, 0]}>
                      {mockDistribucionNotas.map((_, i) => (
                        <Cell key={i} fill={NOTA_COLORS[i]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Promedio por evaluación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockPromediosPorEvaluacion}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 25%, 89%)" />
                    <XAxis dataKey="nombre" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={50} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: "0.5rem", border: "1px solid hsl(214, 25%, 89%)" }} />
                    <Bar dataKey="promedio" fill="hsl(217, 72%, 45%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---- TAB: En riesgo ---- */}
        <TabsContent value="riesgo" className="space-y-4 mt-4">
          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Estudiantes que requieren atención
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Detectados automáticamente según asistencia, notas y participación
              </p>
            </CardHeader>
          </Card>

          {mockEstudiantesEnRiesgo.map((est) => (
            <Card key={est.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-base">{est.nombre}</p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="destructive" className="text-xs">Asist. {est.asistencia}%</Badge>
                      <Badge variant="secondary" className="text-xs">Prom. {est.promedio}</Badge>
                    </div>
                  </div>
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Motivos</p>
                    <ul className="mt-1 space-y-1">
                      {est.motivos.map((m, i) => (
                        <li key={i} className="text-sm flex items-start gap-1.5">
                          <span className="text-destructive mt-1">•</span> {m}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-primary/5 p-3 rounded-lg">
                    <p className="text-xs font-medium text-primary uppercase tracking-wide mb-1">Recomendación</p>
                    <p className="text-sm">{est.recomendacion}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ---- TAB: Tendencias ---- */}
        <TabsContent value="tendencias" className="space-y-6 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" />
                Evolución del promedio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockTendenciaPromedio}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 25%, 89%)" />
                    <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: "0.5rem", border: "1px solid hsl(214, 25%, 89%)" }} />
                    <Area type="monotone" dataKey="promedio" stroke="hsl(217, 72%, 45%)" fill="hsl(217, 72%, 45%)" fillOpacity={0.15} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-accent" />
                Asistencia semanal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockAsistenciaSemanal}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 25%, 89%)" />
                    <XAxis dataKey="semana" tick={{ fontSize: 12 }} />
                    <YAxis domain={[70, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ borderRadius: "0.5rem", border: "1px solid hsl(214, 25%, 89%)" }} />
                    <Line type="monotone" dataKey="porcentaje" stroke="hsl(152, 55%, 42%)" strokeWidth={2} dot={{ fill: "hsl(152, 55%, 42%)", r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <p className="text-sm font-medium">Promedio vs mes anterior</p>
                </div>
                <p className="text-2xl font-bold text-success">+0.3</p>
                <p className="text-xs text-muted-foreground">El grupo mejoró respecto al mes pasado</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-warning" />
                  <p className="text-sm font-medium">Asistencia vs mes anterior</p>
                </div>
                <p className="text-2xl font-bold text-warning">-3%</p>
                <p className="text-xs text-muted-foreground">Leve descenso en asistencia</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryCard({ icon: Icon, value, label, color }: { icon: any; value: string | number; label: string; color: string }) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <Icon className={`h-5 w-5 mx-auto mb-1 ${color}`} />
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
