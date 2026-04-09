

## Diagnostico

Hay dos problemas relacionados:

1. **"??" como nombre**: El perfil no se cargó correctamente (probablemente por un refresh token inválido que impide las queries a Supabase). `AppLayout` muestra `??` cuando `profile?.nombre` es falsy.

2. **No puede cerrar sesión**: La función `signOut` (línea 160-167) hace `await supabase.auth.signOut()` ANTES de limpiar el estado. Si el token es inválido, `signOut()` lanza un error y la limpieza del estado nunca se ejecuta. El usuario queda atrapado.

## Plan

### `src/hooks/useAuth.tsx` — Hacer signOut resiliente

Envolver `supabase.auth.signOut()` en try/catch para que la limpieza del estado local siempre ocurra, incluso si el backend rechaza el token:

```typescript
const signOut = async () => {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.error("[OmniAula][useAuth] signOut error (ignored):", err);
  }
  // Always clear local state
  setUser(null);
  setSession(null);
  setProfile(null);
  setPlanLimits(null);
  setRole(null);
};
```

### Resultado
- Cerrar sesión siempre funciona, incluso con tokens expirados/inválidos
- El usuario es redirigido a `/login` correctamente
- No se requieren cambios en otros archivos

