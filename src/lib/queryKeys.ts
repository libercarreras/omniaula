/**
 * Central query key factory for all React Query keys.
 * Import `qk` wherever you need to match, invalidate, or set query data.
 */
export const qk = {
  // ── ModoClase (Phase 1) ────────────────────────────────────────────────
  claseData:     (claseId: string)               => ["claseData", claseId]               as const,
  asistencia:    (claseId: string, date: string) => ["asistencia", claseId, date]        as const,
  desempeno:     (claseId: string, date: string) => ["desempeno", claseId, date]         as const,
  notas:         (claseId: string, evIds: string)=> ["notas", claseId, evIds]            as const,
  observaciones: (claseId: string, date: string) => ["observaciones", claseId, date]    as const,
  diario:        (claseId: string, date: string) => ["diario", claseId, date]            as const,
  planificacion: (claseId: string, date: string) => ["planificacion", claseId, date]    as const,
  programa:      (claseId: string)               => ["programa", claseId]                as const,

  // ── High-traffic pages (Phase 2) ───────────────────────────────────────
  dashboard:        (institucionId: string)                                    => ["dashboard",        institucionId]                     as const,
  grupos:           (institucionId: string)                                    => ["grupos",           institucionId]                     as const,
  materias:         (userId: string)                                           => ["materias",         userId]                            as const,
  clasesByInst:     (institucionId: string)                                    => ["clasesByInst",     institucionId]                     as const,
  estudiantesByInst:(institucionId: string)                                    => ["estudiantesByInst",institucionId]                     as const,
  grupoColabs:      (userId: string)                                           => ["grupoColabs",      userId]                            as const,
  evaluaciones:     (institucionId: string)                                    => ["evaluaciones",     institucionId]                     as const,
  evalContenidos:   (evalIdsKey: string)                                       => ["evalContenidos",   evalIdsKey]                        as const,
  periodContext:    (claseId: string, desde: string, hasta: string)            => ["periodContext",    claseId, desde, hasta]             as const,
  estudiantesByGrupo: (grupoId: string)                                        => ["estudiantesByGrupo", grupoId]                          as const,

  // ── Page-level & detail queries (Phase 3) ─────────────────────────────
  diarioPage:           (institucionId: string)                              => ["diarioPage",           institucionId]                     as const,
  studentDetail:        (studentId: string)                                  => ["studentDetail",         studentId]                         as const,
  studentObservaciones: (studentId: string)                                  => ["studentObservaciones",  studentId]                         as const,
  studentAsistencia:    (studentId: string, claseId: string)                 => ["studentAsistencia",     studentId, claseId]                as const,
  studentNotas:         (studentId: string)                                  => ["studentNotas",          studentId]                         as const,
};
