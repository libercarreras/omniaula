

## Problem

Two issues causing the auth to appear broken:

1. **Stale closure in timeout**: The 8-second safety timeout at line 128 reads `user`, `profile`, and `loading` from the React closure, which are always their initial values (`null`, `null`, `true`). This means the timeout **always fires** even if bootstrap completed successfully, logging a misleading warning. It's harmless now (since `user` is null in the closure, it won't signOut), but it creates confusion and could interfere with edge cases.

2. **No database triggers**: Despite multiple migration attempts, the triggers that auto-create profiles/roles/institutions for new users still don't exist. Current users have data (backfill worked), but any new signup will break.

## Changes

### 1. `src/hooks/useAuth.tsx` — Fix stale closure with refs

Replace direct state reads in the timeout with `useRef` values that stay current:

```typescript
const mountedRef = useRef(true);
const bootstrapCompleteRef = useRef(false);

// In the timeout:
const timeout = setTimeout(() => {
  if (mountedRef.current && !bootstrapCompleteRef.current) {
    console.warn("[OmniAula][useAuth] Auth timeout");
    setLoading(false);
  }
}, 8000);

// In bootstrap finally:
bootstrapCompleteRef.current = true;
clearTimeout(timeout);
setLoading(false);
```

This ensures the timeout only fires if bootstrap genuinely hasn't completed, and never fires spuriously after success.

### 2. Database migration — Create triggers (idempotent)

```sql
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

DROP TRIGGER IF EXISTS on_auth_user_created_institucion ON auth.users;
CREATE TRIGGER on_auth_user_created_institucion
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_institucion();
```

### Result
- The timeout stops firing spuriously — no more misleading console warnings
- Bootstrap completes cleanly, profile loads, "Karen Carreras" shows immediately
- New user signups automatically get profile + role + institution

