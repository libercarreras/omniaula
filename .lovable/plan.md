

## Plan: Agregar boton y formulario para crear estudiantes

La pagina de Estudiantes actualmente no tiene ningun boton para agregar nuevos estudiantes. Se necesita agregar un boton "Nuevo estudiante" y un dialog modal con formulario.

### Cambios en `src/pages/Estudiantes.tsx`

1. **Agregar boton "Nuevo estudiante"** en el header, al lado del filtro de grupo (igual que en Materias y Grupos)
2. **Agregar Dialog modal** con formulario que incluya:
   - **Nombre completo** (obligatorio) - campo de texto
   - **Grupo** (obligatorio) - selector con los grupos existentes del docente
   - **Numero de lista** (opcional) - campo numerico
3. **Al enviar**: `supabase.from("estudiantes").insert({ nombre_completo, grupo_id, numero_lista, user_id: user.id })`
4. **Tras insertar**: cerrar dialog, mostrar toast, recargar lista
5. **Estado vacio mejorado**: agregar boton CTA "Agregar estudiante" en el estado vacio tambien

### Imports adicionales
- `Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter` de ui/dialog
- `Input`, `Label`, `Button` de ui
- `toast` de hooks/use-toast
- `Plus` de lucide-react

### Patron
Mismo patron usado en Materias.tsx y Grupos.tsx: estados para `dialogOpen`, `nombre`, `saving`, funcion `handleCreate`, y `fetchData` reutilizable.

No se requieren cambios en la base de datos - la tabla `estudiantes` ya tiene las columnas necesarias y RLS para insert con `auth.uid() = user_id`.

