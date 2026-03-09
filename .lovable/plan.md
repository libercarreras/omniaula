

## Plan: Funcionalidades Avanzadas - Colaboracion, Radar de Riesgo, Informes IA y Diario Pedagogico

Este plan abarca 6 funcionalidades nuevas. Dado que la app actualmente usa datos mock, varias de estas funciones se implementaran con datos mock pero con la estructura lista para conectar a la base de datos real.

---

### 1. Colaboracion entre Docentes (Compartir Grupo)

**Base de datos:**
- Nueva tabla `grupo_colaboradores` con columnas: `id`, `grupo_id`, `owner_user_id` (quien invita), `colaborador_user_id` (invitado), `estado` (enum: `pendiente`, `aceptada`, `rechazada`), `created_at`
- Crear enum `estado_invitacion`
- RLS: el owner puede insertar/ver/eliminar; el colaborador puede ver y actualizar (aceptar/rechazar)
- Actualizar RLS de `estudiantes` para que colaboradores tambien puedan leer estudiantes del grupo compartido (usando security definer function)

**Frontend:**
- En la pagina `Grupos.tsx`: boton "Invitar docente" que abre un dialog para buscar docentes por email (query a profiles)
- Nueva seccion "Invitaciones pendientes" en el Dashboard que muestre invitaciones recibidas con botones Aceptar/Rechazar
- Los grupos compartidos aparecen en el listado del docente invitado con un badge "Compartido"

---

### 2. Radar de Riesgo Academico

**Frontend:**
- Nuevo componente `src/components/radar/RadarRiesgo.tsx` que analiza datos de asistencia, notas, tareas y participacion
- Logica de deteccion: asistencia < 75%, promedio < 5, tareas entregadas < 60%, participacion baja
- Seccion visible en el Dashboard: "Estudiantes que requieren atencion" con nombre, motivo y sugerencia
- Usa datos mock por ahora, estructura preparada para queries reales

---

### 3. Generador Automatico de Informes con IA

**Backend:**
- Nueva Edge Function `generate-student-report` que recibe datos del estudiante y genera un informe narrativo completo usando Lovable AI (gemini-3-flash-preview)
- Diferente del boletin existente: este genera un informe mas largo y detallado

**Frontend:**
- Nueva pestaña "Informe IA" en `Informes.tsx` con boton para generar informe completo
- El texto generado es editable, copiable y exportable (print/CSV)

---

### 4. Diario Pedagogico Automatico

**Backend:**
- Nueva Edge Function `generate-diary-summary` que recibe tema, actividad, participacion y genera un resumen pedagogico

**Frontend:**
- En `DiarioClase.tsx`: formulario para nueva entrada con campos tema, actividad, nivel de participacion
- Boton "Generar resumen con IA" que autocompleta la descripcion
- El docente puede editar antes de guardar

---

### 5. Compartir Resumen del Estudiante

**Frontend:**
- En el `StudentDetailSheet.tsx`: nuevo boton "Copiar resumen"
- Genera un texto plano con nombre, asistencia, promedio y observacion general
- Usa `navigator.clipboard.writeText()` + toast de confirmacion
- Formato pensado para enviar por WhatsApp

---

### 6. Panel de Analisis Mejorado

**Frontend:**
- La pagina `Analisis.tsx` ya tiene graficos de recharts. Mejoras:
  - Agregar tarjeta de "Estudiantes en riesgo" directamente en la pestaña de rendimiento
  - Agregar comparacion entre evaluaciones (radar chart o grouped bar chart)
  - Mejorar visualizacion movil de los graficos

---

### Archivos a crear/modificar

| Archivo | Accion |
|---------|--------|
| Migration SQL | Crear tabla `grupo_colaboradores` + enum + RLS |
| `supabase/functions/generate-student-report/index.ts` | Nueva edge function |
| `supabase/functions/generate-diary-summary/index.ts` | Nueva edge function |
| `src/components/radar/RadarRiesgo.tsx` | Nuevo componente radar de riesgo |
| `src/components/colaboracion/InvitarDocente.tsx` | Dialog para invitar docentes |
| `src/components/colaboracion/InvitacionesPendientes.tsx` | Lista de invitaciones |
| `src/pages/Dashboard.tsx` | Agregar radar de riesgo e invitaciones |
| `src/pages/Grupos.tsx` | Agregar boton invitar y badge compartido |
| `src/pages/DiarioClase.tsx` | Formulario nuevo + generacion IA |
| `src/pages/Informes.tsx` | Nueva pestaña informe IA completo |
| `src/pages/Analisis.tsx` | Mejoras visuales y nueva seccion riesgo |
| `src/components/clase/StudentDetailSheet.tsx` | Boton copiar resumen |
| `src/data/mockAnalytics.ts` | Datos mock adicionales para radar |

---

### Orden de implementacion

1. Migration DB (tabla `grupo_colaboradores`)
2. Edge functions (generate-student-report, generate-diary-summary)
3. Componente RadarRiesgo + integracion en Dashboard
4. Colaboracion (invitar docente, invitaciones pendientes, grupos compartidos)
5. Diario pedagogico con IA
6. Informe IA completo en Informes
7. Boton copiar resumen en StudentDetailSheet
8. Mejoras al panel de Analisis

