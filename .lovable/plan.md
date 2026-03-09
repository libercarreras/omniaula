

## Plan: Mejorar manejo de instituciones con edicion, eliminacion y auto-creacion

### Problema actual

1. Las RLS policies de UPDATE/DELETE en `instituciones` tienen un **bug**: comparan `profesor_institucion.institucion_id = profesor_institucion.id` (se compara consigo misma) en vez de `instituciones.id`.
2. No hay UI para editar ni eliminar instituciones.
3. No se crea automaticamente una institucion cuando se registra un nuevo profesor.
4. Si la migracion anterior creo una "Institucion Principal" compartida entre profesores, hay que asegurar que cada profesor tenga su propia copia.

### Cambios

#### 1. Migracion SQL

- **Corregir RLS** de UPDATE y DELETE en `instituciones` para comparar correctamente con `instituciones.id`.
- **Separar instituciones compartidas**: Para cada profesor que comparta una misma institucion con otros, duplicar la institucion y reasignar sus grupos.
- **Crear trigger** `handle_new_user_institucion` que al insertar un usuario en `auth.users`, cree automaticamente una institucion "Mi Institucion" y la entrada en `profesor_institucion` con rol `administrador`.

#### 2. UI de edicion y eliminacion en `src/pages/Instituciones.tsx`

- Agregar botones **Editar** (Pencil) y **Eliminar** (Trash2) en cada card, visibles solo si `inst.rol === 'administrador'`.
- **Dialog de edicion**: mismo formulario pre-llenado. Guarda con `supabase.from("instituciones").update(...)`.
- **AlertDialog de eliminacion**: confirmacion antes de `supabase.from("instituciones").delete(...)`. Los CASCADE en FK limpian `profesor_institucion`.
- Botones usan `e.stopPropagation()` para no activar seleccion del card.

#### 3. Archivos modificados

| Archivo | Cambio |
|---|---|
| Nueva migracion SQL | Corregir RLS, separar instituciones compartidas, trigger auto-creacion |
| `src/pages/Instituciones.tsx` | Agregar editar/eliminar con dialogs |

