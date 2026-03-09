

## Plan: Corregir pantalla negra al crear/editar instituciones

### Diagnostico

El flujo del bug:
1. Usuario llena el formulario y hace click en "Crear institucion"
2. `handleCreate` ejecuta el insert, luego llama `setDialogOpen(false)` y despues `await refresh()`
3. `refresh()` internamente hace `setLoading(true)` en el hook `useInstitucion`
4. La pagina `Instituciones.tsx` tiene `if (loading) return <Loader2 />`, lo que desmonta todo el componente incluyendo los Dialogs
5. El overlay del Dialog (`bg-black/80`) queda atascado en el DOM porque se desmonto antes de completar su animacion de cierre
6. Resultado: pantalla negra sin contenido

### Solucion

Modificar **`src/pages/Instituciones.tsx`**:

1. **No usar el `loading` global para re-renders despues de la carga inicial**: Usar un estado local `initialLoading` que solo sea `true` en el primer render. Asi el spinner solo aparece al cargar la pagina por primera vez, no al hacer refresh.

2. **Reordenar operaciones en `handleCreate`**: Primero cerrar el dialog y limpiar estados, esperar un tick, y luego hacer refresh. O simplemente no destruir los dialogs al hacer refresh.

3. **Agregar `DialogDescription`** a los dialogs de crear y editar para eliminar el warning de Radix.

### Cambio concreto

En `Instituciones.tsx`:
- Cambiar la condicion de loading para usar solo la carga inicial, no los refreshes posteriores
- Mover los Dialogs fuera de la condicion de loading (o mejor, no desmontar todo al refrescar)
- Agregar `DialogDescription` a cada dialog

Solo se modifica `src/pages/Instituciones.tsx`. No requiere migracion SQL.

