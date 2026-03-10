

## Plan: Eliminar evaluaciones

### Enfoque
Agregar un botón de eliminar en el **Detail Sheet** de la evaluación, con confirmación mediante `AlertDialog` para evitar borrados accidentales. Al eliminar, se borran en cascada: `evaluacion_contenido` y `notas` asociadas, luego la evaluación.

### Cambios en `src/pages/Evaluaciones.tsx`

1. **Importar** `AlertDialog` y sus componentes, más el icono `Trash2` (ya importado).

2. **Estado** `deletingEvalId` para controlar el diálogo de confirmación.

3. **Función `handleDeleteEval`**:
   - Borrar de `evaluacion_contenido` donde `evaluacion_id = id`
   - Borrar de `notas` donde `evaluacion_id = id`
   - Borrar de `evaluaciones` donde `id = id`
   - Actualizar estado local (`setEvaluaciones`, `setContenidos`)
   - Cerrar el sheet

4. **UI**: Botón rojo "Eliminar" en el header del Detail Sheet, junto al botón Imprimir. Al hacer click abre un `AlertDialog` pidiendo confirmación con mensaje claro: "Esta acción eliminará la evaluación, sus preguntas y todas las notas asociadas. No se puede deshacer."

### Archivos
| Archivo | Cambio |
|---|---|
| `src/pages/Evaluaciones.tsx` | Agregar AlertDialog de confirmación + lógica de borrado en cascada |

