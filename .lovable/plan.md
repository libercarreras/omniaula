

## Diagnóstico

El problema es una **carrera de condiciones entre Login.tsx y el AuthProvider**:

1. App monta → bootstrap corre → no hay sesión → `loading = false`
2. Usuario hace login → `signInWithPassword` devuelve 200 → Login.tsx llama `navigate("/")` **inmediatamente**
3. `ProtectedRoute` evalúa: `loading=false`, `user=null` → redirige a `/login`
4. Recién después `onAuthStateChange(SIGNED_IN)` dispara → `fetchProfile` empieza → eventualmente setea user/session
5. Pero el usuario ya fue devuelto a `/login`

El resultado: loop infinito en la pantalla de login.

## Solución

### 1. `src/pages/auth/Login.tsx` — No navegar manualmente

Quitar el `navigate("/")` después del login exitoso. En su lugar, usar `useAuth()` para detectar cuando `user` se setea y redirigir reactivamente:

```typescript
const { user } = useAuth();

useEffect(() => {
  if (user) navigate("/", { replace: true });
}, [user, navigate]);
```

En `handleLogin`, simplemente no hacer nada después del éxito (la redirección ocurre sola cuando el AuthProvider actualiza `user`).

### 2. `src/hooks/useAuth.tsx` — Reactivar loading durante login

Cuando `onAuthStateChange` recibe un `SIGNED_IN` y el bootstrap ya terminó, setear `loading = true` antes de fetchProfile. Esto hace que `ProtectedRoute` muestre el spinner en vez de redirigir a login mientras se carga el perfil.

```typescript
if (sess?.user) {
  setLoading(true); // ← evita que ProtectedRoute redirija durante fetchProfile
  try {
    const ok = await fetchProfile(sess.user.id);
    // ...
  }
}
```

### Archivos a modificar
- `src/pages/auth/Login.tsx`
- `src/hooks/useAuth.tsx`

### Resultado
- Login exitoso → AuthProvider procesa el evento → setea loading=true → fetchProfile → setea user+profile → loading=false → ProtectedRoute deja pasar → Dashboard muestra "Karen Carreras"
- No hay ventana de tiempo donde user=null y loading=false después de un login exitoso

