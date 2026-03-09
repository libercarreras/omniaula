

## Plan: Add institution selector to Materias

### Problem
The `materias` table has no `institucion_id` column, so materias can't be associated with an institution. The user needs to assign existing and new materias to their institutions.

### Changes

**1. SQL Migration** -- Add `institucion_id` column to `materias`:
```sql
ALTER TABLE public.materias ADD COLUMN institucion_id uuid REFERENCES public.instituciones(id);
```
The column is nullable so existing materias without an institution won't break.

**2. Update `src/pages/Materias.tsx`**:
- Import `useInstitucion` to get the list of institutions
- Add `institucionId` state for the dialog form
- Add a `Select` dropdown in the create/edit dialog to pick the institution
- Pre-fill `institucionId` when editing an existing materia
- Include `institucion_id` in both `.insert()` and `.update()` calls
- Show the institution name as a small badge on each materia card
- When creating, default to `institucionActiva` if available

