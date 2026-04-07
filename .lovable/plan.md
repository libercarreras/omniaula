

## Diagnóstico

El campo "Institución" en el diálogo de editar grupo es **redundante** y además tiene un bug visual:

1. **Redundancia**: La página Grupos ya filtra por la institución activa seleccionada en el selector global. Todos los grupos que ves pertenecen a esa institución. No tiene sentido poder "cambiar" la institución de un grupo existente — eso rompería la relación con los estudiantes y clases que ya tiene.

2. **Bug visual**: Aunque `openEdit` setea `institucionId` con el valor correcto del grupo, el `<Select>` muestra vacío porque la lista `instituciones` viene de `useInstitucion()` y el valor puede no coincidir exactamente, o el componente no refleja el valor pre-seleccionado correctamente.

## Plan de corrección

### Archivo: `src/pages/Grupos.tsx`

**Al crear un grupo**: Asignar automáticamente la institución activa, sin mostrar selector (ya que estás viendo los grupos de esa institución).

**Al editar un grupo**: No permitir cambiar la institución. Mostrarla como texto informativo de solo lectura, o directamente no mostrarla.

Cambios concretos:

1. **En `openCreate()`**: Setear `institucionId = instId` (ya lo hace) y eliminar el selector del dialog.

2. **En el dialog de crear/editar**: Reemplazar el `<Select>` de institución por un `<p>` que muestre el nombre de la institución activa como información de contexto (no editable). Esto aplica tanto para crear como para editar.

3. **En `handleSave()`**: Usar siempre `instId` (la institución activa) en lugar del estado `institucionId`, eliminando la variable de estado `institucionId` por completo.

### Resultado
- Al crear: se asigna la institución activa automáticamente
- Al editar: no se puede cambiar la institución (comportamiento correcto)
- El campo nunca aparece vacío
- Se elimina código innecesario (estado `institucionId`, `setInstitucionId`)

