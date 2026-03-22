import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays, Loader2, RefreshCw, Check, Clock, XCircle, AlertTriangle,
  ChevronDown, ChevronRight, CalendarCheck, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface PlanItem {
  id?: string;
  fecha: string;
  unidad_index: number;
  tema_index: number;
  unidad_titulo: string;
  tema_titulo: string;
  subtema_titulo: string | null;
  estado: "pendiente" | "completado" | "parcial" | "suspendido" | "reprogramado";
  diario_id?: string | null;
}

interface PlanificacionTimelineProps {
  claseId: string;
  userId: string;
  horario: string | null;
  estructura: { unidades: Array<{ titulo: string; temas: Array<{ titulo: string; subtemas: string[] }> }> } | null;
}

const ESTADO_CONFIG = {
  pendiente: { label: "Pendiente", icon: Clock, color: "bg-muted text-muted-foreground", dot: "bg-muted-foreground/40" },
  completado: { label: "Completado", icon: Check, color: "bg-success/10 text-success border-success/30", dot: "bg-success" },
  parcial: { label: "Parcial", icon: AlertTriangle, color: "bg-warning/10 text-warning border-warning/30", dot: "bg-warning" },
  suspendido: { label: "Suspendido", icon: XCircle, color: "bg-destructive/10 text-destructive border-destructive/30", dot: "bg-destructive" },
  reprogramado: { label: "Reprogramado", icon: RefreshCw, color: "bg-primary/10 text-primary border-primary/30", dot: "bg-primary" },
};

const DIAS_NOMBRE = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function formatDate(fecha: string) {
  const d = new Date(fecha + "T12:00:00");
  return `${DIAS_NOMBRE[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
}

export function PlanificacionTimeline({ claseId, userId, horario, estructura }: PlanificacionTimelineProps) {
  const [plan, setPlan] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedUnits, setExpandedUnits] = useState<Record<number, boolean>>({});

  const hoyISO = new Date().toISOString().split("T")[0];

  useEffect(() => {
    loadPlan();
  }, [claseId]);

  const loadPlan = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("planificacion_clases")
      .select("*")
      .eq("clase_id", claseId)
      .order("fecha", { ascending: true });
    const items = (data || []).map((item: any) => {
      // notas stores the subtema title (plain string) or null
      return {
        id: item.id,
        fecha: item.fecha,
        unidad_index: item.unidad_index,
        tema_index: item.tema_index,
        unidad_titulo: item.unidad_titulo,
        tema_titulo: item.tema_titulo,
        subtema_titulo: item.notas || null,
        estado: item.estado,
        diario_id: item.diario_id,
      } as PlanItem;
    });
    setPlan(items);
    setLoading(false);
  };

  const generatePlan = async () => {
    if (!estructura) {
      toast.error("Primero generá la estructura del programa con IA.");
      return;
    }
    if (!horario) {
      toast.error("Configurá el horario de la clase para poder distribuir el programa.");
      return;
    }

    setGenerating(true);
    try {
      const response = await supabase.functions.invoke("distribute-program", {
        body: {
          estructura,
          horario,
          fechaInicio: hoyISO,
          fechaFin: null,
        },
      });

      if (response.error) throw new Error(response.error.message);
      const data = response.data;
      if (data?.error) { toast.error(data.error); return; }

      // Delete existing plan
      await supabase.from("planificacion_clases").delete().eq("clase_id", claseId);

      // Insert new plan — one row per subtema
      const records = data.plan.map((item: any) => ({
        clase_id: claseId,
        user_id: userId,
        fecha: item.fecha,
        unidad_index: item.unidad_index,
        tema_index: item.tema_index,
        unidad_titulo: item.unidad_titulo,
        tema_titulo: item.tema_titulo,
        notas: item.subtema_titulo || null,
        estado: "pendiente" as const,
      }));

      if (records.length > 0) {
        await supabase.from("planificacion_clases").insert(records);
      }

      toast.success(`Planificación generada: ${data.totalItems} ítems en ${data.totalClasesDisponibles} clases`);
      await loadPlan();

      const exp: Record<number, boolean> = {};
      estructura.unidades.forEach((_, i) => { exp[i] = true; });
      setExpandedUnits(exp);
    } catch (e: any) {
      toast.error(e?.message || "Error al generar planificación");
    } finally {
      setGenerating(false);
    }
  };

  const updateEstado = async (item: PlanItem, newEstado: PlanItem["estado"]) => {
    if (!item.id) return;
    await supabase.from("planificacion_clases").update({ estado: newEstado }).eq("id", item.id);
    setPlan(prev => prev.map(p => p.id === item.id ? { ...p, estado: newEstado } : p));

    if (newEstado === "suspendido") {
      await redistributePending(item);
    }
  };

  const redistributePending = async (suspendedItem: PlanItem) => {
    const pendingAfter = plan.filter(
      p => p.fecha > suspendedItem.fecha && p.estado === "pendiente"
    );
    if (pendingAfter.length === 0) return;

    const nextPending = pendingAfter[0];
    if (nextPending?.id) {
      await supabase.from("planificacion_clases").insert({
        clase_id: claseId,
        user_id: userId,
        fecha: nextPending.fecha,
        unidad_index: suspendedItem.unidad_index,
        tema_index: suspendedItem.tema_index,
        unidad_titulo: suspendedItem.unidad_titulo,
        tema_titulo: suspendedItem.tema_titulo,
        notas: suspendedItem.subtema_titulo,
        estado: "reprogramado" as any,
      });
    }

    toast.info("Subtema reprogramado a la siguiente clase disponible");
    await loadPlan();
  };

  // Stats
  const stats = useMemo(() => {
    const total = plan.length;
    const completados = plan.filter(p => p.estado === "completado").length;
    const parciales = plan.filter(p => p.estado === "parcial").length;
    const suspendidos = plan.filter(p => p.estado === "suspendido").length;
    const progress = total > 0 ? Math.round(((completados + parciales * 0.5) / total) * 100) : 0;
    return { total, completados, parciales, suspendidos, progress };
  }, [plan]);

  // Group by unit > tema
  const groupedByUnit = useMemo(() => {
    const groups: Record<number, {
      titulo: string;
      temas: Record<number, { titulo: string; items: PlanItem[] }>;
    }> = {};

    plan.forEach(item => {
      if (!groups[item.unidad_index]) {
        groups[item.unidad_index] = { titulo: item.unidad_titulo, temas: {} };
      }
      if (!groups[item.unidad_index].temas[item.tema_index]) {
        groups[item.unidad_index].temas[item.tema_index] = { titulo: item.tema_titulo, items: [] };
      }
      groups[item.unidad_index].temas[item.tema_index].items.push(item);
    });
    return groups;
  }, [plan]);

  // Find today's items
  const todayItems = useMemo(() => {
    return plan.filter(p => p.fecha === hoyISO);
  }, [plan, hoyISO]);

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-3">
      {/* Generate/Regenerate button */}
      <Button
        onClick={generatePlan}
        disabled={generating || !estructura}
        className="w-full gap-2 h-11 font-semibold"
        variant={plan.length > 0 ? "outline" : "default"}
      >
        {generating ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Generando planificación...</>
        ) : plan.length > 0 ? (
          <><RefreshCw className="h-4 w-4" /> Regenerar planificación</>
        ) : (
          <><CalendarDays className="h-4 w-4" /> Distribuir programa en clases</>
        )}
      </Button>

      {!estructura && (
        <p className="text-xs text-muted-foreground text-center">Primero analizá el programa con IA para generar la estructura.</p>
      )}

      {plan.length > 0 && (
        <>
          {/* Progress overview */}
          <div className="rounded-lg border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Progreso del programa</span>
              </div>
              <span className="text-lg font-bold text-primary">{stats.progress}%</span>
            </div>
            <Progress value={stats.progress} className="h-2" />
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" /> {stats.completados} completados</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-warning" /> {stats.parciales} parciales</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive" /> {stats.suspendidos} suspendidos</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-muted-foreground/40" /> {stats.total - stats.completados - stats.parciales - stats.suspendidos} pendientes</span>
            </div>
          </div>

          {/* Today's items highlight */}
          {todayItems.length > 0 && (
            <div className="rounded-lg border-2 border-primary bg-primary/5 p-3">
              <div className="flex items-center gap-2 mb-2">
                <CalendarCheck className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-primary uppercase tracking-wide">Hoy</span>
              </div>
              <div className="space-y-2">
                {todayItems.map((item, idx) => {
                  const displayTitle = item.subtema_titulo || item.tema_titulo;
                  return (
                    <div key={item.id || idx}>
                      <p className="text-sm font-semibold">{displayTitle}</p>
                      {item.subtema_titulo && (
                        <p className="text-[10px] text-muted-foreground">Tema: {item.tema_titulo} · U{item.unidad_index + 1}</p>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        {(["completado", "parcial", "suspendido"] as const).map(est => {
                          const cfg = ESTADO_CONFIG[est];
                          return (
                            <button
                              key={est}
                              onClick={() => updateEstado(item, item.estado === est ? "pendiente" : est)}
                              className={cn(
                                "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border transition-all active:scale-95",
                                item.estado === est ? cfg.color : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/60"
                              )}
                            >
                              <cfg.icon className="h-3 w-3" />
                              {cfg.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Timeline by unit > tema > subtema */}
          <div className="space-y-1.5">
            {Object.entries(groupedByUnit).map(([uIdx, group]) => {
              const ui = parseInt(uIdx);
              const isExpanded = expandedUnits[ui] ?? false;
              const allUnitItems = Object.values(group.temas).flatMap(t => t.items);
              const unitCompleted = allUnitItems.filter(i => i.estado === "completado").length;
              const unitTotal = allUnitItems.length;

              return (
                <div key={ui} className="rounded-lg border bg-card overflow-hidden">
                  <button
                    className="flex items-center gap-2 w-full p-3 text-left hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedUnits(prev => ({ ...prev, [ui]: !prev[ui] }))}
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <span className="text-xs font-bold text-primary uppercase tracking-wide shrink-0">U{ui + 1}</span>
                    <span className="text-sm font-semibold flex-1 truncate">{group.titulo}</span>
                    <Badge variant="outline" className="text-[10px] shrink-0">{unitCompleted}/{unitTotal}</Badge>
                  </button>

                  {isExpanded && (
                    <div className="border-t">
                      {Object.entries(group.temas).map(([tIdx, tema]) => {
                        const temaCompleted = tema.items.filter(i => i.estado === "completado").length;
                        const hasSubtemas = tema.items.some(i => i.subtema_titulo);

                        return (
                          <div key={tIdx} className="border-b last:border-b-0">
                            {/* Tema header */}
                            {hasSubtemas && (
                              <div className="px-3 py-1.5 bg-muted/30 flex items-center justify-between">
                                <span className="text-xs font-semibold text-foreground/80 truncate">{tema.titulo}</span>
                                <span className="text-[10px] text-muted-foreground shrink-0">{temaCompleted}/{tema.items.length}</span>
                              </div>
                            )}

                            {/* Items (subtemas or tema itself) */}
                            <div className="divide-y">
                              {tema.items.map((item, idx) => {
                                const cfg = ESTADO_CONFIG[item.estado];
                                const isPast = item.fecha < hoyISO;
                                const isToday = item.fecha === hoyISO;
                                const displayTitle = item.subtema_titulo || item.tema_titulo;

                                return (
                                  <div
                                    key={item.id || idx}
                                    className={cn(
                                      "px-3 py-2",
                                      isToday && "bg-primary/5",
                                      isPast && item.estado === "pendiente" && "bg-destructive/5"
                                    )}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", cfg.dot)} />
                                      <span className={cn(
                                        "text-[11px] font-mono shrink-0 w-16",
                                        isToday ? "text-primary font-bold" : "text-muted-foreground"
                                      )}>
                                        {formatDate(item.fecha)}
                                      </span>
                                      <span className={cn(
                                        "text-sm flex-1 truncate",
                                        item.estado === "completado" && "line-through text-muted-foreground",
                                        item.estado === "suspendido" && "line-through text-destructive/60"
                                      )}>
                                        {hasSubtemas && "• "}{displayTitle}
                                      </span>
                                      <div className="flex items-center gap-0.5 shrink-0">
                                        {(["completado", "parcial", "suspendido"] as const).map(est => {
                                          const c = ESTADO_CONFIG[est];
                                          return (
                                            <button
                                              key={est}
                                              onClick={() => updateEstado(item, item.estado === est ? "pendiente" : est)}
                                              className={cn(
                                                "h-7 w-7 rounded-md flex items-center justify-center transition-all active:scale-95",
                                                item.estado === est ? c.color : "text-muted-foreground/40 hover:text-muted-foreground"
                                              )}
                                              title={c.label}
                                            >
                                              <c.icon className="h-3.5 w-3.5" />
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
