

## Diagnóstico

Los logs muestran dos problemas claros:

1. **`/assets/pwa-icon-192.png` → 404**: `vite-plugin-pwa` procesa los iconos listados en `includeAssets` a través del pipeline de Vite, que los mueve a `/assets/` con hashes en producción. Pero el manifest generado referencia `/assets/pwa-icon-192.png` (sin hash), que no existe. Los archivos originales están en `public/` y son accesibles en `/pwa-icon-192.png` (sin `/assets/`).

2. **Timing del manifest dinámico**: El `setTimeout` de 3 segundos en `main.tsx` swappea el manifest DESPUÉS de que el navegador ya leyó el manifest estático (con las rutas rotas de `/assets/`). Para cuando se aplica el manifest dinámico, el navegador ya falló al validar los iconos del manifest estático, y el evento `beforeinstallprompt` no se dispara.

3. **`AuthApiError: Invalid Refresh Token`**: Un token de sesión expirado — no relacionado con PWA pero puede causar errores en la consulta a `app_settings`.

## Plan de corrección

### 1. `vite.config.ts` — Corregir rutas de iconos

- Quitar `pwa-icon-192.png` y `pwa-icon-512.png` de `includeAssets` para que Vite no los procese (ya están en `public/` y accesibles en la raíz).
- Opcionalmente, agregar `devOptions: { enabled: false }` para evitar interferencia del SW en desarrollo.

### 2. `src/main.tsx` — Reducir delay del manifest swap

- Cambiar el `setTimeout` de 3000ms a ejecución inmediata post-render (0ms o `requestIdleCallback`). El manifest dinámico debe estar listo ANTES de que el navegador evalúe la instalabilidad.
- Mover la consulta a `app_settings` fuera del `setTimeout` para que se ejecute lo antes posible.

### 3. Verificar `dynamic-manifest` Edge Function

- La Edge Function ya funciona correctamente: lee iconos de Storage y los devuelve en el manifest. No necesita cambios.

### Archivos a modificar
- `vite.config.ts` — quitar iconos de `includeAssets`, agregar `devOptions`
- `src/main.tsx` — eliminar el delay de 3s en la inyección del manifest dinámico

### Resultado
- Los iconos del manifest estático apuntan a `/pwa-icon-192.png` (que existe en `public/`)
- Si hay iconos custom, el manifest se swappea inmediatamente sin esperar 3s
- El `beforeinstallprompt` debería dispararse correctamente

