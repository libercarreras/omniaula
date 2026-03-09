

## Plan: Implementar formularios para crear Materia y crear Grupo

Ambos botones ("Nueva materia" y "Nuevo grupo") existen pero no tienen funcionalidad. Se implementaran dialogs modales con formularios que insertan registros en la base de datos.

---

### 1. Materias.tsx - Dialog "Nueva materia"

- Agregar estado `dialogOpen` para controlar el dialog
- El boton "Nueva materia" abre el dialog
- Formulario con un campo: **Nombre de la materia** (obligatorio)
- Al enviar: `supabase.from("materias").insert({ nombre, user_id: user.id })`
- Tras insertar exitosamente: cerrar dialog, mostrar toast de confirmacion, recargar lista de materias
- Importar `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter` + `Input` + `Label` + `toast`

### 2. Grupos.tsx - Dialog "Nuevo grupo"

- Agregar estado `dialogOpen` para controlar el dialog
- El boton "Nuevo grupo" abre el dialog
- Formulario con tres campos:
  - **Nombre del grupo** (obligatorio) - ej: "3°A"
  - **Ano** (opcional) - ej: "2026"
  - **Turno** (opcional) - ej: "Manana" / "Tarde"
- Al enviar: `supabase.from("grupos").insert({ nombre, anio, turno, user_id: user.id })`
- Tras insertar: cerrar dialog, toast, recargar lista

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/Materias.tsx` | Agregar dialog con formulario de creacion de materia |
| `src/pages/Grupos.tsx` | Agregar dialog con formulario de creacion de grupo |

No se requieren cambios en la base de datos - las tablas `materias` y `grupos` ya existen con las columnas necesarias y RLS configurado para insert con `auth.uid() = user_id`.

