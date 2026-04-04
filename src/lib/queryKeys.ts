/**
 * Central query key factory for all React Query keys.
 * Import `qk` wherever you need to match, invalidate, or set query data.
 */
export const qk = {
  claseData:     (claseId: string)               => ["claseData", claseId]               as const,
  asistencia:    (claseId: string, date: string) => ["asistencia", claseId, date]        as const,
  desempeno:     (claseId: string, date: string) => ["desempeno", claseId, date]         as const,
  notas:         (claseId: string, evIds: string)=> ["notas", claseId, evIds]            as const,
  observaciones: (claseId: string, date: string) => ["observaciones", claseId, date]    as const,
  diario:        (claseId: string, date: string) => ["diario", claseId, date]            as const,
  planificacion: (claseId: string, date: string) => ["planificacion", claseId, date]    as const,
  programa:      (claseId: string)               => ["programa", claseId]                as const,
};
