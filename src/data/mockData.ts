export interface Materia {
  id: string;
  nombre: string;
  color: string;
}

export interface Grupo {
  id: string;
  nombre: string;
  cantidadEstudiantes: number;
}

export interface Clase {
  id: string;
  materiaId: string;
  grupoId: string;
  horario: string;
  aula?: string;
}

export interface Estudiante {
  id: string;
  nombre: string;
  apellido: string;
  grupoId: string;
  grupoNombre: string;
  enRiesgo: boolean;
}

export interface Evaluacion {
  id: string;
  titulo: string;
  claseId: string;
  fecha: string;
  tipo: "parcial" | "trabajo" | "oral" | "tarea";
}

export interface Observacion {
  id: string;
  estudianteId: string;
  estudianteNombre: string;
  claseId: string;
  fecha: string;
  tipo: "comportamiento" | "academico" | "positivo";
  nota: string;
}

export interface DiarioClase {
  id: string;
  claseId: string;
  fecha: string;
  descripcion: string;
  temas: string[];
}

export interface Planificacion {
  id: string;
  claseId: string;
  periodo: string;
  objetivo: string;
  estado: "pendiente" | "en_curso" | "completada";
}

// --- Datos mock ---

export const materias: Materia[] = [
  { id: "m1", nombre: "Matemáticas", color: "bg-primary" },
  { id: "m2", nombre: "Física", color: "bg-warning" },
];

export const grupos: Grupo[] = [
  { id: "g1", nombre: "3°A", cantidadEstudiantes: 28 },
  { id: "g2", nombre: "3°B", cantidadEstudiantes: 25 },
  { id: "g3", nombre: "2°A", cantidadEstudiantes: 30 },
  { id: "g4", nombre: "4°C", cantidadEstudiantes: 22 },
];

export const clases: Clase[] = [
  { id: "c1", materiaId: "m1", grupoId: "g1", horario: "Lun/Mié/Vie 8:00", aula: "Aula 12" },
  { id: "c2", materiaId: "m1", grupoId: "g2", horario: "Mar/Jue 9:00", aula: "Aula 8" },
  { id: "c3", materiaId: "m2", grupoId: "g3", horario: "Lun/Mié 10:00", aula: "Lab. 3" },
  { id: "c4", materiaId: "m1", grupoId: "g4", horario: "Mar/Jue 11:00", aula: "Aula 5" },
];

export const estudiantes: Estudiante[] = [
  { id: "e1", nombre: "Lucía", apellido: "García", grupoId: "g1", grupoNombre: "3°A", enRiesgo: false },
  { id: "e2", nombre: "Martín", apellido: "López", grupoId: "g1", grupoNombre: "3°A", enRiesgo: true },
  { id: "e3", nombre: "Valentina", apellido: "Rodríguez", grupoId: "g1", grupoNombre: "3°A", enRiesgo: false },
  { id: "e4", nombre: "Santiago", apellido: "Martínez", grupoId: "g2", grupoNombre: "3°B", enRiesgo: true },
  { id: "e5", nombre: "Camila", apellido: "Fernández", grupoId: "g2", grupoNombre: "3°B", enRiesgo: false },
  { id: "e6", nombre: "Mateo", apellido: "González", grupoId: "g3", grupoNombre: "2°A", enRiesgo: false },
  { id: "e7", nombre: "Sofía", apellido: "Pérez", grupoId: "g3", grupoNombre: "2°A", enRiesgo: true },
  { id: "e8", nombre: "Benjamín", apellido: "Díaz", grupoId: "g4", grupoNombre: "4°C", enRiesgo: false },
];

export const evaluaciones: Evaluacion[] = [
  { id: "ev1", titulo: "Parcial Ecuaciones", claseId: "c1", fecha: "2026-03-12", tipo: "parcial" },
  { id: "ev2", titulo: "Trabajo Práctico Funciones", claseId: "c2", fecha: "2026-03-15", tipo: "trabajo" },
  { id: "ev3", titulo: "Oral Cinemática", claseId: "c3", fecha: "2026-03-18", tipo: "oral" },
  { id: "ev4", titulo: "Tarea Derivadas", claseId: "c4", fecha: "2026-03-10", tipo: "tarea" },
];

export const observaciones: Observacion[] = [
  { id: "o1", estudianteId: "e2", estudianteNombre: "Martín López", claseId: "c1", fecha: "2026-03-07", tipo: "academico", nota: "Dificultades con ecuaciones de segundo grado" },
  { id: "o2", estudianteId: "e4", estudianteNombre: "Santiago Martínez", claseId: "c2", fecha: "2026-03-06", tipo: "comportamiento", nota: "Distracción frecuente en clase" },
  { id: "o3", estudianteId: "e1", estudianteNombre: "Lucía García", claseId: "c1", fecha: "2026-03-08", tipo: "positivo", nota: "Excelente participación en clase" },
];

export const diarioClase: DiarioClase[] = [
  { id: "d1", claseId: "c1", fecha: "2026-03-07", descripcion: "Se trabajó con ecuaciones cuadráticas. Buena participación general.", temas: ["Ecuaciones cuadráticas", "Fórmula resolvente"] },
  { id: "d2", claseId: "c2", fecha: "2026-03-06", descripcion: "Introducción a funciones lineales con gráficos.", temas: ["Funciones lineales", "Representación gráfica"] },
];

export const planificaciones: Planificacion[] = [
  { id: "p1", claseId: "c1", periodo: "Marzo 2026", objetivo: "Ecuaciones de segundo grado y sistemas", estado: "en_curso" },
  { id: "p2", claseId: "c2", periodo: "Marzo 2026", objetivo: "Funciones lineales y cuadráticas", estado: "en_curso" },
  { id: "p3", claseId: "c3", periodo: "Abril 2026", objetivo: "Cinemática y dinámica", estado: "pendiente" },
];

export const actividadReciente = [
  { texto: "Asistencia registrada - Matemáticas 3°A", tiempo: "Hace 2 horas" },
  { texto: "Evaluación creada - Parcial Ecuaciones", tiempo: "Hace 5 horas" },
  { texto: "Observación añadida - Martín López", tiempo: "Ayer" },
  { texto: "Planificación actualizada - Matemáticas 3°B", tiempo: "Hace 2 días" },
];

// --- Helpers ---

export function getClaseLabel(claseId: string): string {
  const clase = clases.find((c) => c.id === claseId);
  if (!clase) return "Clase desconocida";
  const materia = materias.find((m) => m.id === clase.materiaId);
  const grupo = grupos.find((g) => g.id === clase.grupoId);
  return `${materia?.nombre ?? "?"} - ${grupo?.nombre ?? "?"}`;
}

export function getClase(claseId: string) {
  return clases.find((c) => c.id === claseId);
}

export const clasesDelDia = [
  { claseId: "c1", horario: "8:00 - 9:20" },
  { claseId: "c3", horario: "10:00 - 11:20" },
];
