

## Problem

`AuthProvider` only subscribes to `onAuthStateChange` but never calls `supabase.auth.getSession()` first. This is a known race condition: the `INITIAL_SESSION` event from `onAuthStateChange` can fail to fire (or fire before the listener is ready), leaving the app stuck on the loading spinner forever.

The session replay confirms the app is stuck showing the `Loader2` spinner from `ProtectedRoute`.

## Fix

### `src/hooks/useAuth.tsx` — Add `getSession()` bootstrap

Inside the `useEffect`, call `supabase.auth.getSession()` BEFORE setting up `onAuthStateChange`. This ensures the session is restored from storage immediately:

```text
useEffect:
  1. Set up onAuthStateChange listener (for future events)
  2. Call getSession() → if session exists, fetchProfile → setLoading(false)
     → if no session, setLoading(false) immediately
  3. Keep the 10s timeout as a safety net (reduce to 8s)
```

Key rules:
- Do NOT `await` inside `onAuthStateChange` callback for the initial bootstrap — use `getSession()` separately
- `onAuthStateChange` still handles `TOKEN_REFRESHED`, `SIGNED_IN`, `SIGNED_OUT` events for ongoing session management
- The `getSession()` call sets loading=false on its own path, and `onAuthStateChange` only sets loading=false if loading is still true (avoid double-setting)

### No other files need changes

`ProtectedRoute`, `AppLayout`, and `App.tsx` are fine — they just need `loading` to resolve to `false`.

## Result
- App loads immediately instead of waiting up to 10 seconds
- Session is correctly restored from localStorage on page refresh
- No more infinite loading spinner

