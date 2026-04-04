import type { Tables, Json } from "@/integrations/supabase/types";

export type Clase              = Tables<"clases">;
export type Grupo              = Tables<"grupos">;
export type Materia            = Tables<"materias">;
export type Estudiante         = Tables<"estudiantes">;
export type Evaluacion         = Tables<"evaluaciones">;
export type Nota               = Tables<"notas">;
export type Asistencia         = Tables<"asistencia">;
export type Observacion        = Tables<"observaciones">;
export type DiarioClase        = Tables<"diario_clase">;
export type PlanificacionClase = Tables<"planificacion_clases">;
export type { Json };
