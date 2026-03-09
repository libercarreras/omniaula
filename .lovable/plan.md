

## Plan: Eliminar datos mock precargados y conectar con la base de datos real

El problema es que todas las pantallas de la aplicacion (Dashboard, Grupos, Estudiantes, Materias, Asistencia, Evaluaciones, etc.) importan datos estaticos de `src/data/mockData.ts` y `src/data/mockAnalytics.ts`, por lo que cualquier docente nuevo ve exactamente los mismos datos falsos.

La solucion es reemplazar todas las importaciones de datos mock por consultas reales a la base de datos usando el cliente de Supabase. Cada pagina mostrara los datos del docente autenticado (filtrados automaticamente por RLS), y si no tiene datos, mostrara un estado vacio con un call-to-action para empezar.

---

### Archivos a modificar

| Pagina/Componente | Cambio |
|---|---|
| `src/pages/Dashboard.tsx` | Consultar clases, evaluaciones, estudiantes y observaciones reales del usuario. Mostrar estado vacio si no hay datos. |
| `src/pages/Grupos.tsx` | Consultar tabla `grupos` real. Contar estudiantes por grupo. |
| `src/pages/Estudiantes.tsx` | Consultar tabla `estudiantes` real, filtrar por grupo real. |
| `src/pages/Materias.tsx` | Consultar tabla `materias` y `clases` reales. |
| `src/pages/Asistencia.tsx` | Consultar clases y estudiantes reales del usuario. |
| `src/pages/Evaluaciones.tsx` | Consultar tabla `evaluaciones` real. |
| `src/pages/Planificacion.tsx` | Mostrar estado vacio (no hay tabla de planificacion en DB, mantener estructura). |
| `src/pages/Seguimiento.tsx` | Consultar tabla `observaciones` real. |
| `src/pages/DiarioClase.tsx` | Consultar tabla `diario_clase` y `clases` reales. |
| `src/pages/ModoClase.tsx` | Consultar clases, estudiantes, evaluaciones reales. |
| `src/pages/Analisis.tsx` | Consultar clases reales para el selector. Mantener graficos con datos calculados de la DB cuando existan, o estado vacio. |
| `src/pages/Informes.tsx` | Consultar clases y estudiantes reales. |
| `src/components/radar/RadarRiesgo.tsx` | Calcular riesgo desde datos reales (asistencia, notas). |
| `src/components/clase/StudentDetailSheet.tsx` | Consultar observaciones reales del estudiante. |

### Patron de implementacion

Cada pagina seguira este patron:
1. Usar `useAuth()` para obtener el usuario actual
2. Usar `useEffect` + `supabase.from("tabla").select("*")` para cargar datos
3. Mostrar un `Loader` mientras carga
4. Mostrar un estado vacio con icono + mensaje + boton de accion si no hay datos
5. Eliminar la importacion de `@/data/mockData`

### Helper functions

Crear un helper `getClaseLabelFromData(clase, materias, grupos)` que funcione con datos reales en lugar de los mock.

### Archivos que se pueden eliminar eventualmente

- `src/data/mockData.ts` - ya no sera necesario
- `src/data/mockAnalytics.ts` - los datos de analisis se calcularan desde la DB

### Notas

- No se requieren cambios en la base de datos (las tablas ya existen con RLS correcto)
- La pagina de Analisis mantendra graficos pero mostrara "Sin datos suficientes" cuando no haya evaluaciones/asistencia registradas
- El Dashboard mostrara un onboarding suave: "Comienza creando tu primera materia y grupo"

