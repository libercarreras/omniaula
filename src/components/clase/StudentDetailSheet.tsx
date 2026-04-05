import { useMemo } from "react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UserCheck, ClipboardCheck, MessageSquare,
  Copy, Loader2, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import { cn } from "@/lib/utils";

interface StudentDetailSheetProps {
  studentId: string | null;
  claseId: string;
  open: boolean;
  onClose: () => void;
}

type RiskLevel = "bajo" | "medio" | "alto";

function computeRisk(asistencia: any[], notas: any[], observaciones: any[]): { level: RiskLevel; reasons: string[] } {
  const reasons: string[] = [];
  let score = 0;

  // Attendance risk
  const total = asistencia.length;
  const faltas = asistencia.filter(a => a.estado === "falta").length;
  if (total > 0) {
    const pctFaltas = (faltas / total) * 100;
    if (pctFaltas >= 30) { score += 3; reasons.push(`${Math.round(pctFaltas)}% de inasistencias`); }
    else if (pctFaltas >= 15) { score += 1; reasons.push(`${Math.round(pctFaltas)}% de inasistencias`); }
  }

  // Grade risk
  const notasVals = notas.filter(n => n.nota !== null).map(n => Number(n.nota));
  if (notasVals.length > 0) {
    const avg = notasVals.reduce((a, b) => a + b, 0) / notasVals.length;
    if (avg < 4) { score += 3; reasons.push(`Promedio ${avg.toFixed(1)}`); }
    else if (avg < 6) { score += 1; reasons.push(`Promedio ${avg.toFixed(1)}`); }
  }

  // Negative observations
  const negativeObs = observaciones.filter(o => ["actitud", "cumplimiento_tareas", "dificultad_contenidos"].includes(o.tipo));
  if (negativeObs.length >= 5) { score += 2; reasons.push(`${negativeObs.length} observaciones negativas`); }
  else if (negativeObs.length >= 3) { score += 1; reasons.push(`${negativeObs.length} observaciones negativas`); }

  const level: RiskLevel = score >= 4 ? "alto" : score >= 2 ? "medio" : "bajo";
  return { level, reasons };
}

const riskConfig: Record<RiskLevel, { label: string; color: string; bgColor: string }> = {
  bajo: { label: "Riesgo bajo", color: "text-success", bgColor: "bg-success/10" },
  medio: { label: "Riesgo medio", color: "text-warning", bgColor: "bg-warning/10" },
  alto: { label: "Riesgo alto", color: "text-destructive", bgColor: "bg-destructive/10" },
};

export function StudentDetailSheet({ studentId, claseId, open, onClose }: StudentDetailSheetProps) {
  const sid = studentId ?? "";
  const fetchEnabled = !!studentId && open;

  const { data: student, isLoading: loadingStudent } = useQuery({
    queryKey: qk.studentDetail(sid),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estudiantes")
        .select("*")
        .eq("id", sid)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: fetchEnabled,
  });

  const { data: observaciones = [], isLoading: loadingObs } = useQuery({
    queryKey: qk.studentObservaciones(sid),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("observaciones")
        .select("*")
        .eq("estudiante_id", sid)
        .order("fecha", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
    enabled: fetchEnabled,
  });

  const { data: asistenciaHist = [], isLoading: loadingAsist } = useQuery({
    queryKey: qk.studentAsistencia(sid, claseId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("asistencia")
        .select("*")
        .eq("estudiante_id", sid)
        .eq("clase_id", claseId)
        .order("fecha", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
    enabled: fetchEnabled,
  });

  const { data: notasRaw = [], isLoading: loadingNotas } = useQuery({
    queryKey: qk.studentNotas(sid),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notas")
        .select("*, evaluaciones(nombre, tipo)")
        .eq("estudiante_id", sid);
      if (error) throw error;
      return data ?? [];
    },
    enabled: fetchEnabled,
  });

  const notasHist = useMemo(() => notasRaw.filter((n: any) => n.evaluaciones), [notasRaw]);
  const loading = loadingStudent || loadingObs || loadingAsist || loadingNotas;

  const risk = useMemo(() => {
    if (!student) return null;
    return computeRisk(asistenciaHist, notasHist, observaciones);
  }, [student, asistenciaHist, notasHist, observaciones]);

  if (!student && !loading) return null;

  const getInitials = (name: string) => {
    const parts = name?.split(" ") || [];
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : (name || "?").substring(0, 2);
  };

  const asistTotal = asistenciaHist.length;
  const presentes = asistenciaHist.filter(a => a.estado === "presente").length;
  const asistPct = asistTotal > 0 ? Math.round((presentes / asistTotal) * 100) : null;
  const notasVals = notasHist.filter((n: any) => n.nota !== null).map((n: any) => Number(n.nota));
  const promedio = notasVals.length > 0 ? (notasVals.reduce((a, b) => a + b, 0) / notasVals.length).toFixed(1) : null;

  const copiarResumen = () => {
    if (!student) return;
    const pct = asistPct ?? 0;
    const prom = promedio ?? "—";
    const resumen = [
      `📋 Resumen: ${student.nombre_completo}`,
      `Asistencia: ${pct}% (${presentes}/${asistTotal})`,
      `Promedio: ${prom}`,
      `Observaciones: ${observaciones.length}`,
      risk ? `Riesgo: ${riskConfig[risk.level].label}` : "",
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(resumen);
    toast.success("Resumen copiado al portapapeles");
  };

  const tipoLabel: Record<string, string> = {
    participacion: "Participación", actitud: "Actitud",
    cumplimiento_tareas: "Tareas", dificultad_contenidos: "Dificultad",
  };

  const estadoAsistColor: Record<string, string> = {
    presente: "bg-success/10 text-success", falta: "bg-destructive/10 text-destructive",
    tarde: "bg-warning/10 text-warning", retiro: "bg-muted text-muted-foreground",
  };

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : student ? (
          <>
            <SheetHeader className="pb-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">{getInitials(student.nombre_completo)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <SheetTitle className="text-left">{student.nombre_completo}</SheetTitle>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {asistPct !== null && (
                      <Badge className={cn("text-[10px]", asistPct >= 80 ? "bg-success/10 text-success" : asistPct >= 60 ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive")}>
                        {asistPct}% asist.
                      </Badge>
                    )}
                    {promedio && (
                      <Badge className="text-[10px] bg-primary/10 text-primary">Prom: {promedio}</Badge>
                    )}
                    {risk && risk.level !== "bajo" && (
                      <Badge className={cn("text-[10px] gap-1", riskConfig[risk.level].bgColor, riskConfig[risk.level].color)}>
                        <AlertTriangle className="h-2.5 w-2.5" />
                        {riskConfig[risk.level].label}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={copiarResumen}>
                  <Copy className="h-3.5 w-3.5" /> Copiar
                </Button>
              </div>
            </SheetHeader>

            {risk && risk.level !== "bajo" && risk.reasons.length > 0 && (
              <div className={cn("rounded-lg p-3 mb-3 border", riskConfig[risk.level].bgColor)}>
                <p className={cn("text-xs font-semibold flex items-center gap-1.5 mb-1", riskConfig[risk.level].color)}>
                  <AlertTriangle className="h-3.5 w-3.5" /> Indicadores de riesgo
                </p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {risk.reasons.map((r, i) => <li key={i}>• {r}</li>)}
                </ul>
              </div>
            )}

            <Tabs defaultValue="observaciones" className="w-full">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="observaciones" className="text-xs gap-1"><MessageSquare className="h-3.5 w-3.5" /> Obs.</TabsTrigger>
                <TabsTrigger value="asistencia" className="text-xs gap-1"><UserCheck className="h-3.5 w-3.5" /> Asist.</TabsTrigger>
                <TabsTrigger value="notas" className="text-xs gap-1"><ClipboardCheck className="h-3.5 w-3.5" /> Notas</TabsTrigger>
              </TabsList>

              <TabsContent value="observaciones" className="mt-4 space-y-2">
                {observaciones.length > 0 ? (
                  observaciones.map(obs => (
                    <Card key={obs.id}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between mb-1">
                          <Badge variant="secondary" className="text-xs">{tipoLabel[obs.tipo] || obs.tipo}</Badge>
                          <span className="text-xs text-muted-foreground">{obs.fecha}</span>
                        </div>
                        <p className="text-sm mt-1">{obs.descripcion}</p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">Sin observaciones registradas</p>
                )}
              </TabsContent>

              <TabsContent value="asistencia" className="mt-4 space-y-2">
                {asistenciaHist.length > 0 ? (
                  <>
                    <div className="flex items-center gap-3 mb-2 text-xs text-muted-foreground">
                      <span>Últimas {asistTotal} clases</span>
                      <span className="font-semibold text-foreground">{asistPct}% presencia</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {asistenciaHist.map(a => (
                        <div key={a.id} className={cn("rounded-lg p-2 text-center", estadoAsistColor[a.estado] || "bg-muted")}>
                          <p className="text-[10px] font-medium">{new Date(a.fecha + "T12:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "short" })}</p>
                          <p className="text-xs font-bold capitalize mt-0.5">{a.estado === "presente" ? "P" : a.estado === "falta" ? "F" : a.estado === "tarde" ? "T" : "R"}</p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">Sin registros de asistencia</p>
                )}
              </TabsContent>

              <TabsContent value="notas" className="mt-4 space-y-2">
                {notasHist.length > 0 ? (
                  <>
                    {promedio && (
                      <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                        <span>Promedio general:</span>
                        <span className="font-bold text-lg text-primary">{promedio}</span>
                      </div>
                    )}
                    {notasHist.map((n: any) => (
                      <Card key={n.id}>
                        <CardContent className="p-3 flex items-center justify-between">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{n.evaluaciones?.nombre || "Evaluación"}</p>
                            <p className="text-[10px] text-muted-foreground capitalize">{n.evaluaciones?.tipo?.replace(/_/g, " ") || ""}</p>
                          </div>
                          <span className={cn("text-lg font-bold", n.nota !== null && n.nota >= 6 ? "text-success" : "text-destructive")}>{n.nota ?? "—"}</span>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">Sin calificaciones registradas</p>
                )}
              </TabsContent>
            </Tabs>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
