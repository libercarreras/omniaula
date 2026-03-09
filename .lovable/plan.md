

## Plan: Fix RLS INSERT policy on `instituciones`

### Root Cause

The INSERT policy "Authenticated can create instituciones" on the `instituciones` table is **RESTRICTIVE** (`Permissive: No`). In PostgreSQL RLS, restrictive policies alone cannot grant access -- at least one **PERMISSIVE** policy must also pass. Since there is no permissive INSERT policy, all inserts are denied with a 403 error.

### Fix

A single SQL migration to drop the restrictive INSERT policy and recreate it as permissive:

```sql
DROP POLICY "Authenticated can create instituciones" ON instituciones;

CREATE POLICY "Authenticated can create instituciones" ON instituciones
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
```

No code changes needed -- `src/pages/Instituciones.tsx` already works correctly.

