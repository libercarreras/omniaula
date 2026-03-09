

## Plan: Fix instituciones INSERT returning 403

### Root Cause (definitive)

The policies are confirmed PERMISSIVE in the database. The real bug is a **chicken-and-egg problem**:

1. `handleCreate` does: `supabase.from("instituciones").insert({...}).select().single()`
2. The `.select().single()` part asks PostgREST to return the inserted row
3. To return the row, PostgREST evaluates the **SELECT policy**: `is_institucion_member(auth.uid(), id)`
4. `is_institucion_member` checks `profesor_institucion` for a matching row
5. But the `profesor_institucion` row is inserted **AFTER** this call (line 53-55)
6. So the SELECT policy fails, PostgREST returns 403, and the whole operation appears to fail

The INSERT itself succeeds, but the response fails because the user can't SELECT the row they just created.

### Fix

**SQL migration**: Add a second SELECT policy on `instituciones` that allows the **owner** (`auth.uid() = user_id`) to always see their own institutions:

```sql
CREATE POLICY "Owner can view own instituciones" ON instituciones
FOR SELECT TO authenticated
USING (auth.uid() = user_id);
```

This way, even before the `profesor_institucion` row exists, the creator can see (and thus receive back) the institution they just inserted.

No code changes needed. Single SQL migration.

