

## Plan: Add edit/delete for Materias + fix RLS policies

### Problem
1. The `materias` table has all RLS policies set to **RESTRICTIVE** (`Permissive: No`), which blocks all CRUD operations (same systemic issue as `instituciones`).
2. The UI only supports creating materias -- no edit or delete.

### Changes

**1. SQL Migration** -- Drop and recreate all 4 policies on `materias` as PERMISSIVE:
```sql
DROP POLICY IF EXISTS "Users can view own materias" ON materias;
DROP POLICY IF EXISTS "Users can insert own materias" ON materias;
DROP POLICY IF EXISTS "Users can update own materias" ON materias;
DROP POLICY IF EXISTS "Users can delete own materias" ON materias;

CREATE POLICY "Users can view own materias" ON materias FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own materias" ON materias FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own materias" ON materias FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own materias" ON materias FOR DELETE TO authenticated USING (auth.uid() = user_id);
```

**2. Update `src/pages/Materias.tsx`**:
- Add state for editing (`editingMateria`, reuse the dialog for both create/edit)
- Add edit button (Pencil icon) and delete button (Trash icon) on each materia card
- `handleEdit`: calls `supabase.from("materias").update({nombre}).eq("id", id)`
- `handleDelete`: confirmation via alert dialog, then `supabase.from("materias").delete().eq("id", id)`
- Dialog title changes between "Nueva materia" / "Editar materia" based on mode

