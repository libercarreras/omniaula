
Diagnóstico

1. El error más probable no está en el botón PWA
- `src/components/InstallPWAButton.tsx` solo registra `beforeinstallprompt` y no hace trabajo pesado ni ciclos.
- `src/components/InstallBanner.tsx` usa `useInstallPrompt()` aparte; hay lógica duplicada, pero no veo ahí una causa clara de pantalla de carga infinita.

2. Sí hay un problema real en el arranque de autenticación
- En `src/hooks/useAuth.tsx` el estado inicial depende solo de `supabase.auth.onAuthStateChange(...)`.
- No hay bootstrap explícito con `getSession()`.
- Si el evento inicial no llega o queda colgado, `ProtectedRoute` mantiene el spinner.
- Aunque existe timeout de 10s, el flujo sigue siendo frágil y puede dejar la app en un arranque inconsistente.

3. Hay otro punto muy probable de “loading infinito” en la home
- En `src/pages/Dashboard.tsx`, el `useQuery` hace varias consultas encadenadas.
- No hay `try/catch`, no hay timeout y no se validan errores de las respuestas.
- Si alguna consulta queda pendiente o falla de forma no controlada, `isLoading` puede dejar al usuario en spinner indefinido en `/`.

4. `useInstitucion` también está débil para fallos de backend
- `src/hooks/useInstitucion.tsx` no maneja `error` de la consulta.
- Además asume que `row.instituciones` nunca es `null`; si llega nulo, puede romper el mapeo.
- Esto no siempre da spinner infinito, pero sí puede romper el estado inicial y dejar la app en una situación intermedia.

5. Los warnings de refs existen, pero no parecen ser la causa principal
- Los logs muestran:
  - “Function components cannot be given refs”
  - stack en `Routes`, `ProtectedRoute`, `App`
- Eso indica un problema de composición con algún componente usado en routing/render, pero es warning, no un crash fatal por sí solo.
- Lo tomaría como corrección secundaria, no como causa principal del bloqueo.

Conclusión

La app probablemente “se rompió” por una combinación de arranque frágil:
- autenticación inicial sin bootstrap robusto (`useAuth.tsx`)
- pantalla inicial (`Dashboard.tsx`) con queries sin timeout ni manejo de error
- estado de institución (`useInstitucion.tsx`) sin defensas suficientes

El botón PWA no aparece ser el origen del bloqueo.

Plan de corrección

1. Endurecer `src/hooks/useAuth.tsx`
- Mantener `onAuthStateChange`, pero agregar bootstrap inicial con `getSession()`.
- Resolver siempre el loading con fallback seguro a “no autenticado”.
- Evitar dobles resoluciones y carreras entre bootstrap y listener.

2. Blindar `src/pages/Dashboard.tsx`
- Envolver el `queryFn` en `try/catch`.
- Validar `error` en cada consulta.
- Agregar timeout defensivo y estado de error visible en lugar de spinner eterno.

3. Blindar `src/hooks/useInstitucion.tsx`
- Manejar `error` de la consulta.
- Filtrar filas con `instituciones === null`.
- Garantizar `setLoading(false)` también en error.

4. Revisar el warning de refs
- Corregir la composición que está haciendo que React intente pasar refs a un componente de función.
- Esto lo haría después de destrabar la carga.

5. Dejar PWA desacoplado del arranque
- Unificar la lógica de instalación en un solo hook/componente.
- Asegurar que la UI de instalación nunca afecte el render inicial.

Archivos a tocar
- `src/hooks/useAuth.tsx`
- `src/pages/Dashboard.tsx`
- `src/hooks/useInstitucion.tsx`
- posiblemente `src/components/auth/ProtectedRoute.tsx`
- opcionalmente `src/components/InstallPWAButton.tsx` y `src/components/InstallBanner.tsx`

Si aprobás, el orden correcto para arreglarla sería:
1. `useAuth.tsx`
2. `Dashboard.tsx`
3. `useInstitucion.tsx`
4. warning de refs
5. limpieza de PWA
