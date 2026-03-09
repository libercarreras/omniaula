

## Plan: Fix ALL RLS policies on `instituciones` (and `profesor_institucion`) to be PERMISSIVE

### Root Cause

The previous migration to fix the INSERT policy did not resolve the issue because **all 4 policies** on `instituciones` are still RESTRICTIVE (`Permissive: No`). In PostgreSQL RLS, when only restrictive policies exist and no permissive policies exist, access is always denied -- restrictive policies can only further restrict access granted by permissive policies.

This same problem affects `profesor_institucion` (also all RESTRICTIVE), which is needed for the second insert in `handleCreate`.

### Fix

A single SQL migration that drops and recreates all policies on both tables as **PERMISSIVE**:

**`instituciones`** (4 policies):
- SELECT: members can view (using `is_institucion_member`)
- INSERT: authenticated where `auth.uid() = user_id`
- UPDATE: admins via `profesor_institucion` check
- DELETE: admins via `profesor_institucion` check

**`profesor_institucion`** (4 policies):
- SELECT/INSERT/UPDATE/DELETE: authenticated where `auth.uid() = user_id`

All recreated with default `PERMISSIVE` mode. No code changes needed.

