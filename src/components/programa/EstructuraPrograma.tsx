import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles, Loader2, ChevronDown, ChevronRight, Plus, Trash2, Save,
  CheckCircle2, Edit2, GripVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Subtema {
  titulo: string;
}

interface Tema {
  titulo: string;
  subtemas: string[];
}

interface Unidad {
  titulo: string;
  temas: Tema[];
}

interface Estructura {
  unidades: Unidad[];
}

interface EstructuraProgramaProps {
  contenido: string;
  estructuraGuardada: Estructura | null;
  onSave: (estructura: Estructura) => void;
  saving?: boolean;
}

export function EstructuraPrograma({ contenido, estructuraGuardada, onSave, saving }: EstructuraProgramaProps) {
  const [estructura, setEstructura] = useState<Estructura | null>(estructuraGuardada);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const handleAnalyze = async () => {
    if (!contenido || contenido.trim().length < 10) {
      toast.error("Cargá el contenido del programa primero (al menos 10 caracteres).");
      return;
    }
    setIsAnalyzing(true);
    try {
      const response = await supabase.functions.invoke("parse-program", {
        body: { contenido },
      });
      if (response.error) throw new Error(response.error.message);
      const data = response.data;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      setEstructura(data.estructura);
      setEditMode(true);
      // Expand all units by default
      const exp: Record<string, boolean> = {};
      data.estructura.unidades.forEach((_: Unidad, i: number) => { exp[`u-${i}`] = true; });
      setExpanded(exp);
      toast.success("Estructura generada. Revisá y corregí antes de guardar.");
    } catch (e: any) {
      toast.error(e?.message || "Error al analizar el programa");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleExpand = (key: string) => {
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Edit handlers
  const updateUnidadTitulo = (ui: number, titulo: string) => {
    if (!estructura) return;
    const next = { ...estructura, unidades: estructura.unidades.map((u, i) => i === ui ? { ...u, titulo } : u) };
    setEstructura(next);
  };

  const updateTemaTitulo = (ui: number, ti: number, titulo: string) => {
    if (!estructura) return;
    const next = {
      ...estructura,
      unidades: estructura.unidades.map((u, i) => i === ui ? {
        ...u, temas: u.temas.map((t, j) => j === ti ? { ...t, titulo } : t)
      } : u)
    };
    setEstructura(next);
  };

  const updateSubtema = (ui: number, ti: number, si: number, value: string) => {
    if (!estructura) return;
    const next = {
      ...estructura,
      unidades: estructura.unidades.map((u, i) => i === ui ? {
        ...u, temas: u.temas.map((t, j) => j === ti ? {
          ...t, subtemas: t.subtemas.map((s, k) => k === si ? value : s)
        } : t)
      } : u)
    };
    setEstructura(next);
  };

  const addUnidad = () => {
    if (!estructura) return;
    const next = { ...estructura, unidades: [...estructura.unidades, { titulo: "Nueva unidad", temas: [] }] };
    setEstructura(next);
    setExpanded(prev => ({ ...prev, [`u-${next.unidades.length - 1}`]: true }));
  };

  const removeUnidad = (ui: number) => {
    if (!estructura) return;
    setEstructura({ ...estructura, unidades: estructura.unidades.filter((_, i) => i !== ui) });
  };

  const addTema = (ui: number) => {
    if (!estructura) return;
    const next = {
      ...estructura,
      unidades: estructura.unidades.map((u, i) => i === ui ? {
        ...u, temas: [...u.temas, { titulo: "Nuevo tema", subtemas: [] }]
      } : u)
    };
    setEstructura(next);
  };

  const removeTema = (ui: number, ti: number) => {
    if (!estructura) return;
    const next = {
      ...estructura,
      unidades: estructura.unidades.map((u, i) => i === ui ? {
        ...u, temas: u.temas.filter((_, j) => j !== ti)
      } : u)
    };
    setEstructura(next);
  };

  const addSubtema = (ui: number, ti: number) => {
    if (!estructura) return;
    const next = {
      ...estructura,
      unidades: estructura.unidades.map((u, i) => i === ui ? {
        ...u, temas: u.temas.map((t, j) => j === ti ? {
          ...t, subtemas: [...t.subtemas, "Nuevo subtema"]
        } : t)
      } : u)
    };
    setEstructura(next);
  };

  const removeSubtema = (ui: number, ti: number, si: number) => {
    if (!estructura) return;
    const next = {
      ...estructura,
      unidades: estructura.unidades.map((u, i) => i === ui ? {
        ...u, temas: u.temas.map((t, j) => j === ti ? {
          ...t, subtemas: t.subtemas.filter((_, k) => k !== si)
        } : t)
      } : u)
    };
    setEstructura(next);
  };

  const handleSave = () => {
    if (!estructura) return;
    onSave(estructura);
    setEditMode(false);
    toast.success("Estructura guardada correctamente");
  };

  const totalTemas = estructura?.unidades.reduce((acc, u) => acc + u.temas.length, 0) || 0;
  const totalSubtemas = estructura?.unidades.reduce((acc, u) => acc + u.temas.reduce((a, t) => a + t.subtemas.length, 0), 0) || 0;

  return (
    <div className="space-y-3">
      {/* Analyze button */}
      <Button
        onClick={handleAnalyze}
        disabled={isAnalyzing || !contenido}
        className="w-full gap-2 h-11 font-semibold"
        variant={estructura ? "outline" : "default"}
      >
        {isAnalyzing ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Analizando programa...</>
        ) : estructura ? (
          <><Sparkles className="h-4 w-4" /> Re-analizar con IA</>
        ) : (
          <><Sparkles className="h-4 w-4" /> Analizar programa con IA</>
        )}
      </Button>

      {/* Structure display */}
      {estructura && (
        <div className="space-y-2">
          {/* Stats bar */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="font-medium">{estructura.unidades.length} unidades</span>
              <span>·</span>
              <span>{totalTemas} temas</span>
              <span>·</span>
              <span>{totalSubtemas} subtemas</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => setEditMode(!editMode)}
              >
                <Edit2 className="h-3 w-3" />
                {editMode ? "Vista" : "Editar"}
              </Button>
              {editMode && (
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                  Guardar
                </Button>
              )}
            </div>
          </div>

          {/* Units */}
          <div className="space-y-1.5">
            {estructura.unidades.map((unidad, ui) => {
              const uKey = `u-${ui}`;
              const isExpanded = expanded[uKey] ?? false;

              return (
                <div key={ui} className="rounded-lg border bg-card overflow-hidden">
                  {/* Unit header */}
                  <button
                    className="flex items-center gap-2 w-full p-3 text-left hover:bg-muted/50 transition-colors"
                    onClick={() => toggleExpand(uKey)}
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <span className="text-xs font-bold text-primary uppercase tracking-wide shrink-0">Unidad {ui + 1}</span>
                    {editMode ? (
                      <Input
                        value={unidad.titulo}
                        onChange={e => updateUnidadTitulo(ui, e.target.value)}
                        onClick={e => e.stopPropagation()}
                        className="h-7 text-sm font-semibold flex-1"
                      />
                    ) : (
                      <span className="text-sm font-semibold flex-1 truncate">{unidad.titulo}</span>
                    )}
                    <span className="text-[10px] text-muted-foreground shrink-0">{unidad.temas.length} temas</span>
                    {editMode && (
                      <button onClick={e => { e.stopPropagation(); removeUnidad(ui); }} className="text-destructive hover:text-destructive/80 p-1">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </button>

                  {/* Topics */}
                  {isExpanded && (
                    <div className="border-t">
                      {unidad.temas.map((tema, ti) => (
                        <div key={ti} className="border-b last:border-b-0">
                          <div className="flex items-center gap-2 px-3 py-2 pl-9">
                            <span className="text-[10px] font-mono text-muted-foreground shrink-0">{ui + 1}.{ti + 1}</span>
                            {editMode ? (
                              <Input
                                value={tema.titulo}
                                onChange={e => updateTemaTitulo(ui, ti, e.target.value)}
                                className="h-7 text-sm flex-1"
                              />
                            ) : (
                              <span className="text-sm flex-1">{tema.titulo}</span>
                            )}
                            {editMode && (
                              <button onClick={() => removeTema(ui, ti)} className="text-destructive hover:text-destructive/80 p-1">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>

                          {/* Subtopics */}
                          {tema.subtemas.length > 0 && (
                            <div className="pb-2">
                              {tema.subtemas.map((sub, si) => (
                                <div key={si} className="flex items-center gap-2 px-3 py-1 pl-16">
                                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                                  {editMode ? (
                                    <Input
                                      value={sub}
                                      onChange={e => updateSubtema(ui, ti, si, e.target.value)}
                                      className="h-6 text-xs flex-1"
                                    />
                                  ) : (
                                    <span className="text-xs text-muted-foreground">{sub}</span>
                                  )}
                                  {editMode && (
                                    <button onClick={() => removeSubtema(ui, ti, si)} className="text-destructive hover:text-destructive/80 p-0.5">
                                      <Trash2 className="h-2.5 w-2.5" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {editMode && (
                            <button
                              onClick={() => addSubtema(ui, ti)}
                              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary px-3 py-1 pl-16 transition-colors"
                            >
                              <Plus className="h-2.5 w-2.5" /> Subtema
                            </button>
                          )}
                        </div>
                      ))}

                      {editMode && (
                        <button
                          onClick={() => addTema(ui)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary px-3 py-2 pl-9 w-full transition-colors"
                        >
                          <Plus className="h-3 w-3" /> Agregar tema
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {editMode && (
            <Button variant="outline" size="sm" className="w-full gap-1 text-xs" onClick={addUnidad}>
              <Plus className="h-3 w-3" /> Agregar unidad
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
