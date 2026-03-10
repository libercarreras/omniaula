

## Diagnóstico

### Bloqueador critico: RLS sigue RESTRICTIVE
La migración anterior falló silenciosamente. El DROP intenta borrar `"Users can view own clases"` pero la política real se llama `"Users can select own clases"`. El `DROP IF EXISTS` no falla, pero tampoco borra nada. Luego el `CREATE` falla porque la política ya existe. **Resultado: todas las tablas operativas siguen con políticas RESTRICTIVE, bloqueando todo CRUD desde el cliente.**

### Estado actual de ModoClase
- Asistencia, notas, observaciones y diario ya tienen lógica de guardado, pero requieren presionar "Guardar" manualmente.
- Los datos se cargan correctamente desde la DB al entrar.
- No hay auto-guardado, corrección de texto, ni sugerencias.

---

## Plan de implementación

### 1. Corregir RLS (migración nueva)
Ejecutar una nueva migración que:
- Dropee las políticas usando los **nombres exactos actuales** de cada tabla (verificados en el contexto)
- Recree todas como PERMISSIVE
- Tablas: `clases`, `asistencia`, `diario_clase`, `evaluaciones`, `notas`, `observaciones`, `tareas`, `entregas`, `materias`, `estudiantes`, `grupos`

### 2. Auto-guardado con debounce en ModoClase (`src/pages/ModoClase.tsx`)
- Implementar un hook `useDebounce` que dispare el guardado automático 2 segundos después del último cambio
- Aplicar a: asistencia (al cambiar estado), observaciones (al togglear tag), notas (al modificar valor), diario (al escribir)
- Mostrar indicador sutil de estado: "Guardando..." / "Guardado ✓" en la barra superior
- Eliminar los botones manuales de "Guardar" (se vuelven innecesarios)

### 3. Normalización de texto inteligente
- **En campos de nombre** (estudiantes, materias): auto-capitalizar primera letra de cada palabra al perder foco (onBlur)
- **Trim automático** de espacios extra
- **Detección de duplicados** al agregar estudiantes: comparar nombre normalizado contra existentes en el grupo, mostrar advertencia antes de guardar
- Aplicar en: `Estudiantes.tsx` (crear/editar + CSV import), `Materias.tsx`

### 4. Sugerencias de diario basadas en historial
- Al entrar al tab "Diario", consultar los últimos 5 registros de `diario_clase` de la misma clase
- Mostrar chips/badges con temas anteriores que el profesor puede tocar para autocompletar el campo "Tema trabajado"
- Implementar como una fila de botones debajo del input de tema

### 5. Mejoras visuales y de flujo en ModoClase
- Agregar barra de resumen contextual por tab: asistencia muestra P/F/T counts, notas muestra promedio parcial, observaciones muestra conteo
- Swipe gesture friendly: hacer los botones de asistencia más grandes en móvil (ya son 11x11, mantener)
- Agregar feedback háptico visual (animación de pulse) al marcar asistencia/observación

### 6. Dashboard: acceso directo mejorado
- Agregar botón "Iniciar clase" prominente en cada tarjeta de "Clases de hoy" (en lugar de solo clickear la card)
- Mostrar conteo de estudiantes en cada tarjeta de clase del dashboard
- Si no hay clases hoy, mostrar las clases del día siguiente como "Próximas clases"

### Archivos a modificar
- **Nueva migración SQL**: corregir RLS de 11 tablas
- `src/pages/ModoClase.tsx`: auto-save, indicador de estado, sugerencias de diario, mejoras visuales
- `src/pages/Estudiantes.tsx`: normalización de nombres, detección de duplicados
- `src/pages/Materias.tsx`: normalización de nombres
- `src/pages/Dashboard.tsx`: mejoras de acceso y próximas clases
- `src/hooks/useDebounce.ts`: nuevo hook para auto-guardado

### Orden de ejecución
1. Migración RLS (sin esto nada funciona)
2. Hook useDebounce + auto-save en ModoClase
3. Normalización de texto en Estudiantes/Materias
4. Sugerencias de diario
5. Mejoras de Dashboard

