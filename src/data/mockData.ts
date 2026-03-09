export interface Grupo {
  id: string;
  nombre: string;
  materia: string;
  horario: string;
  cantidadEstudiantes: number;
  color: string;
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
  grupoId: string;
  grupoNombre: string;
  fecha: string;
  tipo: "parcial" | "trabajo" | "oral" | "tarea";
}

export interface Observacion {
  id: string;
  estudianteId: string;
  estudianteNombre: string;
  fecha: string;
  tipo: "comportamiento" | "academico" | "positivo";
  nota: string;
}

export interface DiarioClase {
  id: string;
  grupoId: string;
  grupoNombre: string;
  fecha: string;
  descripcion: string;
  temas: string[];
}

export interface Planificacion {
  id: string;
  grupoId: string;
  grupoNombre: string;
  periodo: string;
  objetivo: string;
  estado: "pendiente" | "en_curso" | "completada";
}

export const grupos: Grupo[] = [
  { id: "g1", nombre: "3°A", materia: "Matemáticas", horario: "Lun/Mié/Vie 8:00", cantidadEstudiantes: 28, color: "bg-primary" },
  { id: "g2", nombre: "3°B", materia: "Matemáticas", horario: "Mar/Jue 9:00", cantidadEstudiantes: 25, color: "bg-accent" },
  { id: "g3", nombre: "2°A", materia: "Física", horario: "Lun/Mié 10:00", cantidadEstudiantes: 30, color: "bg-warning" },
  { id: "g4", nombre: "4°C", materia: "Matemáticas", horario: "Mar/Jue 11:00", cantidadEstudiantes: 22, color: "bg-destructive" },
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
  { id: "ev1", titulo: "Parcial Ecuaciones", grupoId: "g1", grupoNombre: "3°A", fecha: "2026-03-12", tipo: "parcial" },
  { id: "ev2", titulo: "Trabajo Práctico Funciones", grupoId: "g2", grupoNombre: "3°B", fecha: "2026-03-15", tipo: "trabajo" },
  { id: "ev3", titulo: "Oral Cinemática", grupoId: "g3", grupoNombre: "2°A", fecha: "2026-03-18", tipo: "oral" },
  { id: "ev4", titulo: "Tarea Derivadas", grupoId: "g4", grupoNombre: "4°C", fecha: "2026-03-10", tipo: "tarea" },
];

export const observaciones: Observacion[] = [
  { id: "o1", estudianteId: "e2", estudianteNombre: "Martín López", fecha: "2026-03-07", tipo: "academico", nota: "Dificultades con ecuaciones de segundo grado" },
  { id: "o2", estudianteId: "e4", estudianteNombre: "Santiago Martínez", fecha: "2026-03-06", tipo: "comportamiento", nota: "Distracción frecuente en clase" },
  { id: "o3", estudianteId: "e1", estudianteNombre: "Lucía García", fecha: "2026-03-08", tipo: "positivo", nota: "Excelente participación en clase" },
];

export const diarioClase: DiarioClase[] = [
  { id: "d1", grupoId: "g1", grupoNombre: "3°A", fecha: "2026-03-07", descripcion: "Se trabajó con ecuaciones cuadráticas. Buena participación general.", temas: ["Ecuaciones cuadráticas", "Fórmula resolvente"] },
  { id: "d2", grupoId: "g2", grupoNombre: "3°B", fecha: "2026-03-06", descripcion: "Introducción a funciones lineales con gráficos.", temas: ["Funciones lineales", "Representación gráfica"] },
];

export const planificaciones: Planificacion[] = [
  { id: "p1", grupoId: "g1", grupoNombre: "3°A", periodo: "Marzo 2026", objetivo: "Ecuaciones de segundo grado y sistemas", estado: "en_curso" },
  { id: "p2", grupoId: "g2", grupoNombre: "3°B", periodo: "Marzo 2026", objetivo: "Funciones lineales y cuadráticas", estado: "en_curso" },
  { id: "p3", grupoId: "g3", grupoNombre: "2°A", periodo: "Abril 2026", objetivo: "Cinemática y dinámica", estado: "pendiente" },
];

export const actividadReciente = [
  { texto: "Asistencia registrada - 3°A", tiempo: "Hace 2 horas" },
  { texto: "Evaluación creada - Parcial Ecuaciones", tiempo: "Hace 5 horas" },
  { texto: "Observación añadida - Martín López", tiempo: "Ayer" },
  { texto: "Planificación actualizada - 3°B", tiempo: "Hace 2 días" },
];

export const clasesDelDia = [
  { grupo: "3°A", materia: "Matemáticas", horario: "8:00 - 9:20", aula: "Aula 12" },
  { grupo: "2°A", materia: "Física", horario: "10:00 - 11:20", aula: "Lab. 3" },
];
