

## Diagnóstico: Pantalla negra en Chromebook durante auto-guardado

El problema es un **cuello de botella de red N+1**: cada función de guardado hace consultas **secuenciales individuales** por cada estudiante. Por ejemplo, para 30 alumnos en asistencia:

1. `SELECT` para verificar si existe → espera respuesta
2. `UPDATE` o `INSERT` → espera respuesta
3. Repetir 30 veces = **60 consultas secuenciales**

Esto se multiplica por cada tipo de dato (asistencia, desempeño, participación, notas, observaciones). En una Chromebook con conexión lenta, esto puede bloquear la interfaz por varios segundos, causando la pantalla negra.

## Solución: Reemplazar N+1 con operaciones batch/upsert

Reescribir las 6 funciones de guardado para usar **operaciones batch** en lugar de loops secuenciales:

### Cambios en `src/pages/ModoClase.tsx`

| Función | Antes (N+1) | Después (batch) |
|---|---|---|
| `saveAsistenciaFn` | Loop: SELECT + UPDATE/INSERT por alumno | `upsert()` batch con todos los registros |
| `saveNotasFn` | Loop: SELECT + UPDATE/INSERT por nota | `upsert()` batch con `onConflict` |
| `saveObservacionesFn` | DELETE all + INSERT batch | Ya es batch, mantener igual |
| `saveParticipacionFn` | Loop: SELECT + UPDATE/INSERT por alumno | DELETE all + INSERT batch (como obs) |
| `saveDesempenoFn` | Loop: SELECT + UPDATE/INSERT por alumno | DELETE all + INSERT batch |
| `saveDiarioFn` | Single upsert | Ya es eficiente, mantener igual |

### Estrategia para cada función

**Asistencia**: Reemplazar el loop por:
- `DELETE` todos los registros del día/clase
- `INSERT` batch con todos los estados actuales (solo los no-null)
- De 60 queries → 2 queries

**Notas**: Similar patrón:
- `DELETE` notas existentes de las evaluaciones activas
- `INSERT` batch con todas las notas
- De 60 queries → 2 queries

**Participación y Desempeño**: Mismo patrón DELETE+INSERT batch.

### Resultado esperado
- De ~60-120 queries secuenciales → 2 queries por guardado
- Tiempo de guardado: de 5-15s → <500ms
- Elimina completamente el bloqueo de pantalla

