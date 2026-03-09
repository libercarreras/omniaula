

# Modelo Materia + Grupo = Clase

## Cambio conceptual

Actualmente el modelo tiene `Grupo` con una `materia` como string. El nuevo modelo introduce tres entidades separadas:

- **Materia**: entidad independiente (ej: Matemáticas, Física)
- **Grupo**: entidad independiente (ej: 3°A, 2°A) — un grupo de estudiantes
- **Clase**: la combinación materia + grupo (ej: Matemáticas con 3°A). Toda la data operativa (asistencia, evaluaciones, diario, planificación, observaciones) se vincula a una Clase

## Cambios en mockData.ts

Nuevas interfaces y datos:

```
Materia { id, nombre, color }
Grupo   { id, nombre, cantidadEstudiantes }
Clase   { id, materiaId, grupoId, horario }  // reemplaza al Grupo actual
```

- `Estudiante.grupoId` se mantiene (pertenece al grupo)
- `Evaluacion`, `DiarioClase`, `Planificacion`, `Observacion` cambian `grupoId` → `claseId`
- Se agregan helpers: `getClaseLabel(claseId)` → "Matemáticas - 3°A"

## Datos mock de ejemplo

- Materias: Matemáticas, Física
- Grupos: 3°A, 3°B, 2°A, 4°C
- Clases: Matemáticas-3°A, Matemáticas-3°B, Física-2°A, Matemáticas-4°C (misma estructura actual pero explícita)

## Cambios en pantallas

1. **Dashboard** — mostrar materia + grupo en clases del día y evaluaciones
2. **Grupos** — agregar sección/pantalla de Materias, o mostrar las clases agrupadas por materia
3. **Asistencia** — selector cambia de grupo a clase (materia + grupo)
4. **Evaluaciones** — mostrar clase en lugar de solo grupo
5. **Seguimiento** — vincular observaciones a clase
6. **Diario de Clase** — selector por clase
7. **Planificación** — vincular a clase
8. **Estudiantes** — filtro por grupo (sin cambio conceptual, los estudiantes pertenecen al grupo)
9. **Sidebar/Nav** — sin cambios

## Nuevo módulo: Materias

Agregar una pantalla simple `/materias` que liste las materias del docente y sus clases asociadas, accesible desde la navegación.

## Archivos a modificar
- `src/data/mockData.ts` — reestructurar interfaces y datos
- `src/pages/Dashboard.tsx`, `Asistencia.tsx`, `Evaluaciones.tsx`, `Seguimiento.tsx`, `DiarioClase.tsx`, `Planificacion.tsx`, `Grupos.tsx` — actualizar referencias
- `src/pages/Materias.tsx` — crear nueva pantalla
- `src/App.tsx` — agregar ruta `/materias`
- `src/components/layout/AppSidebar.tsx` y `MobileNav.tsx` — agregar enlace a Materias

