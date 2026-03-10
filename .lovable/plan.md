

## Diagnóstico

### Bloqueador critico: RLS sigue RESTRICTIVE
Todas las políticas operativas siguen siendo `Permissive: No`. Las migraciones anteriores fallaron silenciosamente. Los nombres exactos actuales son: `asistencia_select`, `clases_select`, `diario_select`, etc. Sin corregir esto, ninguna operación CRUD funciona.

### ModoClase ya tiene buen auto-save
El componente ya implementa debounce de 2s para asistencia, notas, observaciones y diario. Lo que falta:
- Auto-detectar si no hay asistencia hoy y abrir esa pestaña automáticamente
- Guardar por estudiante individual (upsert) en vez de delete-all + re-insert

### Asistencia.tsx (página standalone) está rota
- No guarda en DB (botón "Guardar" sin handler)
- Usa estados diferentes (`ausente`/`tardanza`) vs ModoClase (`falta`/`tarde`)
- No tiene auto-save ni carga datos existentes

---

## Plan de implementación

### 1. Migración RLS correctiva
Dropear las políticas con los nombres exactos verificados y recrearlas como PERMISSIVE para 11 tablas:

```text
Tabla              | Políticas a dropear
asistencia         | asistencia_select, asistencia_insert, asistencia_update, asistencia_delete
clases             | clases_select, clases_insert, clases_update, clases_delete  
diario_clase       | diario_select, diario_insert, diario_update, diario_delete
evaluaciones       | evaluaciones_select, evaluaciones_insert, evaluaciones_update, evaluaciones_delete
notas              | notas_select, notas_insert, notas_update, notas_delete
observaciones      | observaciones_select, observaciones_insert, observaciones_update, observaciones_delete
tareas             | tareas_select, tareas_insert, tareas_update, tareas_delete
entregas           | entregas_select, entregas_insert, entregas_update, entregas_delete
materias           | materias_select, materias_insert, materias_update, materias_delete
estudiantes        | estudiantes_select, estudiantes_insert, estudiantes_update, estudiantes_delete
grupos             | grupos_select, grupos_insert, grupos_update, grupos_delete
```

Recrear todas como PERMISSIVE con `auth.uid() = user_id`. Mantener políticas especiales existentes (colaboradores, institución) intactas.

### 2. ModoClase: auto-detección de asistencia (`src/pages/ModoClase.tsx`)
- Después de cargar datos, si `asistencia` está vacío (no hay registros para hoy), forzar `setModoActivo("asistencia")` automáticamente
- Si ya hay registros, mantener el tab por defecto

### 3. ModoClase: upsert individual de asistencia
- Cambiar `saveAsistenciaFn` de "delete all + bulk insert" a upsert individual por estudiante
- Esto evita race conditions y es más eficiente

### 4. Asistencia.tsx: conectar a DB con auto-save
- Alinear estados con los de la DB: `presente`, `falta`, `tarde` (en vez de `ausente`/`tardanza`)
- Cargar asistencia existente para la fecha actual al seleccionar clase
- Implementar auto-save con `useDebounceCallback` (upsert por estudiante)
- Agregar botón "Todos presentes"
- Agregar indicador de guardado
- Agregar contadores P/F/T
- Eliminar botón manual "Guardar asistencia"

### Archivos a modificar
- **Nueva migración SQL**: corregir RLS de 11 tablas
- `src/pages/ModoClase.tsx`: auto-detección de tab + upsert individual
- `src/pages/Asistencia.tsx`: persistencia, auto-save, estados alineados, UX mejorada

