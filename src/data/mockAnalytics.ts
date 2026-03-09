// Mock analytics data for charts and analysis

export const mockPromediosPorEvaluacion = [
  { nombre: "Parcial 1", promedio: 6.8 },
  { nombre: "TP Funciones", promedio: 7.5 },
  { nombre: "Oral", promedio: 7.2 },
  { nombre: "Parcial 2", promedio: 6.5 },
  { nombre: "TP Final", promedio: 8.1 },
];

export const mockDistribucionNotas = [
  { rango: "0-3", cantidad: 1 },
  { rango: "4-5", cantidad: 3 },
  { rango: "6-7", cantidad: 8 },
  { rango: "8-9", cantidad: 10 },
  { rango: "10", cantidad: 6 },
];

export const mockAsistenciaSemanal = [
  { semana: "Sem 1", porcentaje: 92 },
  { semana: "Sem 2", porcentaje: 88 },
  { semana: "Sem 3", porcentaje: 95 },
  { semana: "Sem 4", porcentaje: 85 },
  { semana: "Sem 5", porcentaje: 90 },
  { semana: "Sem 6", porcentaje: 87 },
];

export const mockTendenciaPromedio = [
  { mes: "Feb", promedio: 6.5 },
  { mes: "Mar", promedio: 6.8 },
  { mes: "Abr", promedio: 7.1 },
  { mes: "May", promedio: 6.9 },
  { mes: "Jun", promedio: 7.4 },
];

export interface EstudianteEnRiesgo {
  id: string;
  nombre: string;
  motivos: string[];
  recomendacion: string;
  asistencia: number;
  promedio: number;
}

export const mockEstudiantesEnRiesgo: EstudianteEnRiesgo[] = [
  {
    id: "e2",
    nombre: "Martín López",
    motivos: ["5 faltas en el último mes", "Promedio por debajo de 5"],
    recomendacion: "Revisar progreso académico y reforzar contenidos de ecuaciones. Contactar a la familia.",
    asistencia: 65,
    promedio: 4.2,
  },
  {
    id: "e4",
    nombre: "Santiago Martínez",
    motivos: ["Baja participación", "No entrega tareas frecuentemente"],
    recomendacion: "Generar instancias de participación individual. Verificar comprensión de consignas.",
    asistencia: 78,
    promedio: 5.1,
  },
  {
    id: "e7",
    nombre: "Sofía Pérez",
    motivos: ["Dificultad en contenidos", "Promedio descendente"],
    recomendacion: "Proponer actividades de refuerzo. Evaluar posible tutoría entre pares.",
    asistencia: 88,
    promedio: 4.8,
  },
];

export interface EstudianteReporte {
  id: string;
  nombre: string;
  asistencia: number;
  promedio: number;
  evaluaciones: { nombre: string; nota: number; fecha: string }[];
  observaciones: string[];
  participacion: "Alta" | "Media" | "Baja";
  tareasEntregadas: number;
  tareasTotal: number;
}

export const mockEstudianteReporte: EstudianteReporte = {
  id: "e1",
  nombre: "Lucía García",
  asistencia: 95,
  promedio: 8.3,
  evaluaciones: [
    { nombre: "Parcial Ecuaciones", nota: 8, fecha: "2026-03-01" },
    { nombre: "TP Funciones", nota: 9, fecha: "2026-02-20" },
    { nombre: "Oral Cinemática", nota: 8, fecha: "2026-02-10" },
  ],
  observaciones: [
    "Excelente participación en clase",
    "Ayuda a compañeros con dificultades",
  ],
  participacion: "Alta",
  tareasEntregadas: 8,
  tareasTotal: 9,
};

export const mockGrupoReporte = {
  clase: "Matemáticas - 3°A",
  periodo: "Marzo 2026",
  totalEstudiantes: 28,
  promedioGeneral: 7.1,
  asistenciaPromedio: 88,
  altoRendimiento: 10,
  bajoRendimiento: 4,
  tareasEntregadasPromedio: 85,
  evaluacionesRealizadas: 5,
};
