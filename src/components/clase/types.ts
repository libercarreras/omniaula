import { ThumbsUp, AlertCircle, BookX, Brain } from "lucide-react";

export type ModoActivo = "resumen" | "asistencia" | "notas" | "observaciones" | "diario" | "desempeno" | "programa";
export type EstadoAsistencia = "presente" | "falta" | "tarde" | "retiro" | null;
export type NivelParticipacion = "alta" | "media" | "baja";
export type NivelDesempeno = "B" | "M" | "A" | "A+" | null;

export const tagObservaciones = [
  { id: "participacion", label: "Buen desempeño", icon: ThumbsUp, color: "bg-success/10 text-success border-success/30", tipo: "participacion" as const },
  { id: "actitud", label: "Necesita apoyo", icon: AlertCircle, color: "bg-warning/10 text-warning border-warning/30", tipo: "actitud" as const },
  { id: "cumplimiento_tareas", label: "No entrega tareas", icon: BookX, color: "bg-destructive/10 text-destructive border-destructive/30", tipo: "cumplimiento_tareas" as const },
  { id: "dificultad_contenidos", label: "Dificultad", icon: Brain, color: "bg-primary/10 text-primary border-primary/30", tipo: "dificultad_contenidos" as const },
];

export interface TabBadges {
  asistencia: { complete: boolean; missing: number };
  notas: { sinNota: number };
  observaciones: { count: number };
  diario: { complete: boolean };
  desempeno: { count: number; total: number };
  programa: { hasContent: boolean };
}
