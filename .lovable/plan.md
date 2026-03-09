

## Plan: Add edit/delete to Grupos and Estudiantes

### Problem
Groups and students created before the institution system have no edit/delete UI, so they can't be reassigned to correct institutions/groups. Also, all RLS policies on `grupos`, `estudiantes`, and related tables are **RESTRICTIVE**, which will cause 403 errors on CRUD operations.

### Changes

**1. SQL Migration** -- Fix RESTRICTIVE policies on `grupos` and `estudiantes`:

Drop and recreate all policies as PERMISSIVE for both tables. For `grupos`, keep the `is_institucion_member` SELECT policy but make it permissive. For `estudiantes`, keep the `is_grupo_colaborador` SELECT policy but make it permissive.

**2. Update `src/pages/Grupos.tsx`**:
- Add `editingGrupo` state and `deleteTarget` state
- Add edit (Pencil) and delete (Trash2) icons on each grupo card
- Edit opens the same dialog pre-filled; changes `institucion_id` via a selector of all user institutions
- `handleSave`: checks for `editingGrupo` to do `.update()` or `.insert()`
- `handleDelete`: confirmation AlertDialog, then `.delete().eq("id", id)`
- Add institution selector (Select) in the dialog so groups can be reassigned between institutions

**3. Update `src/pages/Estudiantes.tsx`**:
- Add `editingEstudiante` state and `deleteTarget` state
- Add edit (Pencil) and delete (Trash2) icons on each student card
- Edit opens the same dialog pre-filled; allows changing grupo assignment
- `handleSave`: checks for `editingEstudiante` to do `.update()` or `.insert()`
- `handleDelete`: confirmation AlertDialog, then `.delete().eq("id", id)`

### Technical Details

Both pages already have create dialogs. We reuse them for edit mode by:
1. Setting an `editing` state variable when clicking the pencil icon
2. Pre-filling form fields from the selected record
3. Switching between `.insert()` and `.update()` in the save handler
4. Adding AlertDialog for delete confirmation

For grupo reassignment between institutions, import `useInstitucion` (already imported) and use `instituciones` array to show an institution selector in the edit dialog.

