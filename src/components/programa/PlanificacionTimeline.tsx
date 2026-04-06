import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays, Loader2, RefreshCw, Check, Clock, XCircle, AlertTriangle,
  ChevronDown, ChevronRight, CalendarCheck, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getFutureClassDates } from "@/lib/calendarUtils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";

/* ── Types ── */

interface SubtemaRow {
  id?: string;
  fecha: string;
  unidad_index: number;
  tema_index: number;
  unidad_titulo: string;
  tema_titulo: string;
  subtema_titulo: string;
  completado: boolean;
  estado: "pendiente" | "completado" | "parcial" | "suspendido" | "reprogramado";
  diario_id?: string | null;
}

interface PlanificacionTimelineProps {
  claseId: string;
  userId: string;
  horario: string | null;
  estructura: { unidades: Array<{ titulo: string; temas: Array<{ titulo: string; subtemas: string[] }> }> } | null;
}

/* ── Helpers ── */

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

function isOldFormat(rows: any[]): boolean {
  return rows.some(r => {
    if (!r.notas) return true;
    try {
      const parsed = JSON.parse(r.notas);
      if (Array.isArray(parsed)) return true;
      return false;
    } catch { return false; }
  });
}

function parseRowSubtema(row: any): SubtemaRow {
  let subtema_titulo = row.tema_titulo;
  let completado = row.estado === "completado";

  if (row.notas) {
    try {
      const parsed = JSON.parse(row.notas);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        subtema_titulo = parsed.subtema || row.tema_titulo;
        completado = !!parsed.completado;
      }
    } catch {}
  }

  return {
    id: row.id,
    fecha: row.fecha,
    unidad_index: row.unidad_index,
    tema_index: row.tema_index,
    unidad_titulo: row.unidad_titulo,
    tema_titulo: row.tema_titulo,
    subtema_titulo,
    completado,
    estado: completado ? "completado" : (row.estado as SubtemaRow["estado"]),
    diario_id: row.diario_id,
  };
}

/* ── Component ── */

export function PlanificacionTimeline({ claseId, userId, horario, estructura }: PlanificacionTimelineProps) {
  const [rows, setRows] = useState<SubtemaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedUnits, setExpandedUnits] = useState<Record<number, boolean>>({});
  const migrationDone = useRef(false);
  const recalcInProgress = useRef(false);

  const hoyISO = new Date().toISOString().split("T")[0];

  useEffect(() => { migrationDone.current = false; loadPlan(); }, [claseId]);

  /* ── Load & auto-migrate ── */
  const loadPlan = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("planificacion_clases")
        .select("*")
        .eq("clase_id", claseId)
        .order("fecha", { ascending: true });

      if (error) {
        console.error("loadPlan error:", error);
        setLoading(false);
        return;
      }

      const rawRows = data || [];

      // Auto-migrate old format (1 row per tema → N rows per subtema)
      if (!migrationDone.current && rawRows.length > 0 && isOldFormat(rawRows)) {
        migrationDone.current = true;
        await migrateOldFormat(rawRows);
        return; // migrateOldFormat calls loadPlan once more
      }

      const parsed = rawRows.map(parseRowSubtema);

      // Recalc stale dates WITHOUT recursion — updates DB and local state directly
      if (parsed.length > 0 && !recalcInProgress.current) {
        const recalculated = await recalcStaleDatesInPlace(parsed);
        setRows(recalculated);
      } else {
        setRows(parsed);
      }
    } catch (err) {
      console.error("loadPlan unexpected error:", err);
    } finally {
      setLoading(false);
    }
  };

  const migrateOldFormat = async (oldRows: any[]) => {
    const newRecords: any[] = [];
    const idsToDelete: string[] = [];

    for (const row of oldRows) {
      let subtemas: Array<{ titulo: string; completado: boolean }> = [];
      if (row.notas) {
        try {
          const parsed = JSON.parse(row.notas);
          if (Array.isArray(parsed) && parsed.length > 0) {
            if (typeof parsed[0] === "object" && "titulo" in parsed[0]) {
              subtemas = parsed;
            } else {
              subtemas = parsed.map((s: string) => ({ titulo: String(s), completado: false }));
            }
          }
        } catch {}
      }

      if (subtemas.length <= 1) {
        const sub = subtemas[0];
        const subTitulo = sub?.titulo || row.tema_titulo;
        const subCompletado = sub?.completado || row.estado === "completado";
        if (row.id) {
          await supabase.from("planificacion_clases").update({
            notas: JSON.stringify({ subtema: subTitulo, completado: subCompletado }),
            estado: subCompletado ? "completado" : row.estado,
          }).eq("id", row.id);
        }
        continue;
      }

      idsToDelete.push(row.id);
      subtemas.forEach((sub) => {
        newRecords.push({
          clase_id: row.clase_id,
          user_id: row.user_id,
          fecha: row.fecha,
          unidad_index: row.unidad_index,
          tema_index: row.tema_index,
          unidad_titulo: row.unidad_titulo,
          tema_titulo: row.tema_titulo,
          notas: JSON.stringify({ subtema: sub.titulo, completado: sub.completado }),
          estado: sub.completado ? "completado" : "pendiente",
        });
      });
    }

    if (idsToDelete.length > 0) {
      await supabase.from("planificacion_clases").delete().in("id", idsToDelete);
    }
    if (newRecords.length > 0) {
      await supabase.from("planificacion_clases").insert(newRecords);
    }

    toast.info("Planificación actualizada al nuevo formato por subtema.");
    await loadPlan();
  };

  /* ── Recalc stale dates — NO recursion, returns updated rows ── */
  const recalcStaleDatesInPlace = async (currentRows: SubtemaRow[]): Promise<SubtemaRow[]> => {
    if (recalcInProgress.current) return currentRows;
    recalcInProgress.current = true;

    try {
      const pendingRows = currentRows
        .filter(r => r.estado === "pendiente" || r.estado === "parcial")
        .sort((a, b) => a.unidad_index - b.unidad_index || a.tema_index - b.tema_index);

      if (pendingRows.length === 0) return currentRows;

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDates = getFutureClassDates(horario, tomorrow, pendingRows.length);
      if (futureDates.length === 0) return currentRows;

      const updates: Array<{ id: string; fecha: string }> = [];
      pendingRows.forEach((row, idx) => {
        const newFecha = futureDates[Math.min(idx, futureDates.length - 1)];
        if (row.id && newFecha !== row.fecha) {
          updates.push({ id: row.id, fecha: newFecha });
        }
      });

      if (updates.length === 0) return currentRows;

      // Update DB
      await Promise.all(
        updates.map(u => supabase.from("planificacion_clases").update({ fecha: u.fecha }).eq("id", u.id))
      );

      // Update local state directly — no reload
      const updateMap = new Map(updates.map(u => [u.id, u.fecha]));
      const updatedRows = currentRows.map(r =>
        r.id && updateMap.has(r.id) ? { ...r, fecha: updateMap.get(r.id)! } : r
      );

      toast.info(`${updates.length} subtema(s) reprogramado(s) a las próximas clases disponibles.`);
      return updatedRows;
    } catch (err) {
      console.error("recalcStaleDatesInPlace error:", err);
      return currentRows;
    } finally {
      recalcInProgress.current = false;
    }
  };

  /* ── Generate ── */
  const generatePlan = async () => {
    if (!estructura) { toast.error("Primero generá la estructura del programa con IA."); return; }
    if (!horario) { toast.error("Configurá el horario de la clase para poder distribuir el programa."); return; }

    setGenerating(true);
    try {
      const response = await supabase.functions.invoke("distribute-program", {
        body: { estructura, horario, fechaInicio: hoyISO, fechaFin: null },
      });
      if (response.error) throw new Error(response.error.message);
      const data = response.data;
      if (data?.error) { toast.error(data.error); return; }

      await supabase.from("planificacion_clases").delete().eq("clase_id", claseId);

      const records = data.plan.map((item: any) => ({
        clase_id: claseId,
        user_id: userId,
        fecha: item.fecha,
        unidad_index: item.unidad_index,
        tema_index: item.tema_index,
        unidad_titulo: item.unidad_titulo,
        tema_titulo: item.tema_titulo,
        notas: JSON.stringify({ subtema: item.subtema_titulo, completado: false }),
        estado: "pendiente" as const,
      }));

      if (records.length > 0) await supabase.from("planificacion_clases").insert(records);

      toast.success(`Planificación generada: ${data.totalSubtemas} subtemas en ${data.totalClasesDisponibles} clases`);
      migrationDone.current = true;
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

  /* ── Toggle subtema — updates DB + local state, then recalc in-place ── */
  const toggleSubtema = useCallback(async (row: SubtemaRow) => {
    if (!row.id) return;
    const newCompleted = !row.completado;
    const newEstado = newCompleted ? "completado" : "pendiente";

    // Optimistic local update
    const updatedRows = rows.map(r =>
      r.id === row.id ? { ...r, completado: newCompleted, estado: newEstado as SubtemaRow["estado"] } : r
    );
    setRows(updatedRows);

    // Persist to DB
    await supabase.from("planificacion_clases").update({
      notas: JSON.stringify({ subtema: row.subtema_titulo, completado: newCompleted }),
      estado: newEstado,
    }).eq("id", row.id);

    // Recalc dates in-place if just completed
    if (newCompleted) {
      const recalculated = await recalcStaleDatesInPlace(updatedRows);
      setRows(recalculated);
    }
  }, [rows, horario]);

  /* ── Suspend tema ── */
  const toggleSuspendTema = useCallback(async (unidadIdx: number, temaIdx: number) => {
    const temaRows = rows.filter(r => r.unidad_index === unidadIdx && r.tema_index === temaIdx);
    const allSuspended = temaRows.every(r => r.estado === "suspendido");
    const newEstado = allSuspended ? "pendiente" : "suspendido";

    const updatedRows = rows.map(r => {
      if (r.unidad_index === unidadIdx && r.tema_index === temaIdx) {
        return { ...r, estado: newEstado as SubtemaRow["estado"], completado: false };
      }
      return r;
    });
    setRows(updatedRows);

    const ids = temaRows.map(r => r.id).filter(Boolean) as string[];
    await Promise.all(
      ids.map(id => supabase.from("planificacion_clases").update({ estado: newEstado }).eq("id", id))
    );

    if (newEstado === "suspendido") {
      const recalculated = await recalcStaleDatesInPlace(updatedRows);
      setRows(recalculated);
    }
  }, [rows, horario]);

  /* ── Stats ── */
  const stats = useMemo(() => {
    let total = 0;
    let completados = 0;
    let suspendidos = 0;

    rows.forEach(r => {
      if (r.estado === "suspendido") { suspendidos++; return; }
      total++;
      if (r.completado) completados++;
    });

    const progress = total > 0 ? Math.round((completados / total) * 100) : 0;
    return { total, completados, suspendidos, progress };
  }, [rows]);

  /* ── Group: unit → tema → subtemas ── */
  const grouped = useMemo(() => {
    const units: Record<number, {
      titulo: string;
      temas: Record<number, { titulo: string; rows: SubtemaRow[] }>;
    }> = {};

    rows.forEach(r => {
      if (!units[r.unidad_index]) {
        units[r.unidad_index] = { titulo: r.unidad_titulo, temas: {} };
      }
      const u = units[r.unidad_index];
      if (!u.temas[r.tema_index]) {
        u.temas[r.tema_index] = { titulo: r.tema_titulo, rows: [] };
      }
      u.temas[r.tema_index].rows.push(r);
    });

    return units;
  }, [rows]);

  const todayRows = useMemo(() => rows.filter(r => r.fecha === hoyISO), [rows, hoyISO]);

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-3">
      {/* Generate button */}
      <Button onClick={generatePlan} disabled={generating || !estructura} className="w-full gap-2 h-11 font-semibold" variant={rows.length > 0 ? "outline" : "default"}>
        {generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generando planificación...</>
          : rows.length > 0 ? <><RefreshCw className="h-4 w-4" /> Regenerar planificación</>
          : <><CalendarDays className="h-4 w-4" /> Distribuir programa en clases</>}
      </Button>

      {!estructura && <p className="text-xs text-muted-foreground text-center">Primero analizá el programa con IA para generar la estructura.</p>}

      {rows.length > 0 && (
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
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success" /> {stats.completados}/{stats.total} subtemas</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive" /> {stats.suspendidos} suspendidos</span>
            </div>
          </div>

          {/* Today's subtemas */}
          {todayRows.length > 0 && (
            <div className="rounded-lg border-2 border-primary bg-primary/5 p-3">
              <div className="flex items-center gap-2 mb-2">
                <CalendarCheck className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-primary uppercase tracking-wide">Hoy</span>
              </div>
              {todayRows.map(row => (
                <label key={row.id} className="flex items-center gap-2 cursor-pointer py-1">
                  <Checkbox
                    checked={row.completado}
                    onCheckedChange={() => toggleSubtema(row)}
                    disabled={row.estado === "suspendido"}
                    className="h-4 w-4"
                  />
                  <div className="flex-1 min-w-0">
                    <span className={cn("text-sm", row.completado && "line-through text-muted-foreground")}>{row.subtema_titulo}</span>
                    <span className="text-[10px] text-muted-foreground ml-2">{row.tema_titulo}</span>
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* Timeline: Unit → Tema → Subtemas */}
          <div className="space-y-1.5">
            {Object.entries(grouped).sort(([a], [b]) => +a - +b).map(([uIdx, unit]) => {
              const ui = parseInt(uIdx);
              const isExpanded = expandedUnits[ui] ?? false;
              const unitRows = Object.values(unit.temas).flatMap(t => t.rows);
              const unitDone = unitRows.length > 0 && unitRows.every(r => r.completado || r.estado === "suspendido");
              const unitCompletedCount = unitRows.filter(r => r.completado).length;

              return (
                <div key={ui} className="rounded-lg border bg-card overflow-hidden">
                  <button
                    className="flex items-center gap-2 w-full p-3 text-left hover:bg-muted/50 transition-colors"
                    onClick={() => setExpandedUnits(prev => ({ ...prev, [ui]: !prev[ui] }))}
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <span className={cn("text-xs font-bold uppercase tracking-wide shrink-0", unitDone ? "text-success" : "text-primary")}>U{ui + 1}</span>
                    <span className={cn("text-sm font-semibold flex-1 truncate", unitDone && "text-success")}>{unit.titulo}</span>
                    <Badge variant="outline" className={cn("text-[10px] shrink-0", unitDone && "border-success/30 text-success")}>
                      {unitDone ? <Check className="h-3 w-3 mr-1" /> : null}{unitCompletedCount}/{unitRows.length}
                    </Badge>
                  </button>

                  {isExpanded && (
                    <div className="border-t">
                      {Object.entries(unit.temas).sort(([a], [b]) => +a - +b).map(([tIdx, tema]) => {
                        const ti = parseInt(tIdx);
                        const temaCompleted = tema.rows.every(r => r.completado);
                        const temaSuspended = tema.rows.every(r => r.estado === "suspendido");
                        const fechas = tema.rows.map(r => r.fecha).sort();
                        const fechaRange = fechas.length > 1
                          ? `${formatDate(fechas[0])} → ${formatDate(fechas[fechas.length - 1])}`
                          : formatDate(fechas[0] || "");

                        return (
                          <div key={ti} className="border-b last:border-b-0">
                            {/* Tema header */}
                            <div className={cn(
                              "flex items-center gap-2 px-3 py-2 bg-muted/20",
                              temaCompleted && "bg-success/5",
                              temaSuspended && "bg-destructive/5",
                            )}>
                              <span className={cn(
                                "h-2 w-2 rounded-full shrink-0",
                                temaCompleted ? "bg-success" : temaSuspended ? "bg-destructive" : "bg-muted-foreground/40",
                              )} />
                              <span className={cn(
                                "text-xs font-semibold flex-1",
                                temaCompleted && "text-success line-through",
                                temaSuspended && "text-destructive/60 line-through",
                              )}>
                                {tema.titulo}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono">{fechaRange}</span>
                              <button
                                onClick={() => toggleSuspendTema(ui, ti)}
                                className={cn(
                                  "h-6 w-6 rounded-md flex items-center justify-center transition-all active:scale-95 shrink-0",
                                  temaSuspended ? ESTADO_CONFIG.suspendido.color : "text-muted-foreground/40 hover:text-muted-foreground"
                                )}
                                title="Suspender tema"
                              >
                                <XCircle className="h-3 w-3" />
                              </button>
                            </div>

                            {/* Subtema rows */}
                            <div className="divide-y divide-border/50">
                              {tema.rows.map(row => {
                                const isPast = row.fecha < hoyISO;
                                const isToday = row.fecha === hoyISO;
                                return (
                                  <div key={row.id} className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 pl-6",
                                    isToday && "bg-primary/5",
                                    isPast && row.estado === "pendiente" && "bg-destructive/5",
                                  )}>
                                    <Checkbox
                                      checked={row.completado}
                                      onCheckedChange={() => toggleSubtema(row)}
                                      disabled={row.estado === "suspendido"}
                                      className="h-3.5 w-3.5 shrink-0"
                                    />
                                    <span className={cn(
                                      "text-[11px] font-mono shrink-0 w-16",
                                      isToday ? "text-primary font-bold" : "text-muted-foreground",
                                    )}>
                                      {formatDate(row.fecha)}
                                    </span>
                                    <span className={cn(
                                      "text-[11px] flex-1",
                                      row.completado ? "line-through text-muted-foreground" : "text-foreground",
                                      row.estado === "suspendido" && "text-destructive/40 line-through",
                                    )}>
                                      {row.subtema_titulo}
                                    </span>
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
