

## Diagnóstico

El flujo actual tiene una ventana de tiempo donde el usuario queda en estado "medio cargado":

```text
t=0ms    onAuthStateChange(INITIAL_SESSION) fires
         → setUser(user) ← ¡se ejecuta inmediatamente!
         → fetchProfile() empieza (3 queries en paralelo)
t=8000ms timeout fires → setLoading(false)
         → ProtectedRoute ve user ≠ null, deja pasar
         → AppLayout muestra profile?.nombre → "??" porque profile es null todavía
t=???    fetchProfile completa → profile se setea → "??" desaparece
         (o nunca completa si el servicio estaba reiniciándose)
```

El problema: `setUser()` ocurre ANTES de que `fetchProfile()` termine. El timeout corta la espera y muestra la app con perfil incompleto.

## Solución

### `src/hooks/useAuth.tsx` — 2 cambios

1. **No setear `user`/`session` hasta que `fetchProfile` termine**: En ambos paths (onAuthStateChange y getSession), mover los `setUser`/`setSession` después del `fetchProfile` exitoso. Así, si el timeout corta, `user` sigue siendo `null` y ProtectedRoute redirige a login limpiamente.

2. **Timeout inteligente**: Cuando el timeout dispara, si hay un `user` seteado pero no hay `profile`, forzar signOut en vez de solo `setLoading(false)`.

Cambio concreto en el bootstrap (getSession):
```typescript
supabase.auth.getSession().then(async ({ data: { session: sess } }) => {
  if (!mounted) return;
  bootstrapDone = true;
  if (sess?.user) {
    try {
      const ok = await fetchProfile(sess.user.id);
      if (ok && mounted) {
        // Solo setear user/session DESPUÉS de confirmar el perfil
        setSession(sess);
        setUser(sess.user);
      } else if (mounted) {
        toast.error("La cuenta no terminó de configurarse.");
        await signOut();
      }
    } catch { /* ... */ }
  }
  if (mounted) { clearTimeout(timeout); setLoading(false); }
});
```

Mismo patrón en el callback de `onAuthStateChange` para eventos distintos a INITIAL_SESSION (como SIGNED_IN).

### Resultado
- Si fetchProfile tarda >8s: timeout dispara, `user` es null, redirect a login (en vez de mostrar "??")
- Si fetchProfile funciona: user + profile se setean juntos, sin estado intermedio inconsistente
- Si fetchProfile falla: signOut limpio

