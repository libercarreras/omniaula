

## Diagnóstico

El flujo de auth tiene demasiadas condiciones de carrera acumuladas por los intentos previos de fix. El problema fundamental: `onAuthStateChange` es un callback async pero Supabase no lo awaita, lo que significa que múltiples eventos pueden ejecutarse concurrentemente y pisar estado entre sí. Además, condicionar `setUser` a que `fetchProfile` termine crea un acoplamiento frágil.

Los logs confirman:
- El timeout de 8s dispara en el boot inicial (Supabase tarda en responder)
- Después del login, el handler de `SIGNED_IN` setea `loading=true` y espera `fetchProfile`, pero si hay cualquier error silencioso o race condition, `user` nunca se setea y la app queda cargando

## Solución: Simplificar radicalmente

Separar la carga de auth en dos capas independientes:

### 1. `src/hooks/useAuth.tsx` — Reescribir el useEffect

**Capa 1: Auth state** — Setear `user`/`session` INMEDIATAMENTE desde `onAuthStateChange`, sin esperar nada:

```typescript
onAuthStateChange((event, sess) => {
  if (event === "SIGNED_OUT") { clearState(); setLoading(false); return; }
  setSession(sess);
  setUser(sess?.user ?? null);
  setLoading(false);
});
```

**Capa 2: Profile** — Un `useEffect` separado que depende de `user`:

```typescript
useEffect(() => {
  if (!user) { setProfile(null); setRole(null); return; }
  fetchProfile(user.id);
}, [user?.id]);
```

**Bootstrap**: `getSession()` sigue corriendo antes del listener, pero solo para restaurar la sesión. No necesita lógica compleja.

### 2. `src/components/auth/ProtectedRoute.tsx` — Verificar profile

Cambiar la condición para que también espere el perfil:

```typescript
const { user, profile, loading } = useAuth();
if (loading) return <spinner>;
if (!user) return <Navigate to="/login">;
if (!profile) return <spinner>; // esperando fetchProfile
return children;
```

### 3. `src/components/layout/AppLayout.tsx` — Fallback seguro

Si `profile?.nombre` es falsy, mostrar el email del usuario en vez de "??".

### Resultado
- Auth state siempre sincronizado con Supabase (sin esperar queries)
- Profile se carga en paralelo, ProtectedRoute espera ambos
- No hay ventana donde `user` existe pero `profile` no (el spinner cubre esa transición)
- Imposible quedar en loading infinito: el auth state se resuelve inmediatamente
- El "??" desaparece porque nunca se renderiza la app sin profile

### Archivos a modificar
- `src/hooks/useAuth.tsx`
- `src/components/auth/ProtectedRoute.tsx`
- `src/components/layout/AppLayout.tsx` (fallback menor)

