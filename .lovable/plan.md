

## Diagnóstico: Pantalla negra en Modo Clase — Desempeño

El problema tiene **dos causas combinadas** relacionadas con el PWA:

### Causa 1: Service Worker intercepta requests de guardado
El workbox está configurado con `NetworkFirst` y `networkTimeoutSeconds: 10` para **todas** las requests a Supabase (`/^https:\/\/.*\.supabase\.co\/.*/i`). Esto incluye las mutaciones (DELETE + INSERT) del auto-guardado. En una Chromebook lenta:
- Si la red tarda >10s, workbox sirve desde cache (que no tiene respuesta para POST/DELETE)
- Esto puede causar errores silenciosos que dejan la UI en estado corrupto

### Causa 2: Auto-update del Service Worker recarga la página
`registerType: "autoUpdate"` con `immediate: true` significa que si se detecta una nueva versión del SW **mientras la profesora trabaja**, el SW se activa automáticamente. Esto puede causar un reload inesperado → pantalla negra → la profesora tiene que refrescar y pierde su posición.

### Causa 3: Sin manejo de errores en el catch del debounce
El `useDebounceCallback` tiene un `catch` vacío que solo pone `status: "idle"`. Si el save falla por culpa del SW, no hay ningún log ni feedback.

## Plan de solución

### 1. Excluir mutaciones del cache del Service Worker (`vite.config.ts`)
Cambiar el `urlPattern` del runtimeCaching para que solo cachee requests GET, no POST/DELETE/PATCH. Agregar `method: 'GET'` al runtimeCaching entry.

### 2. Cambiar de `autoUpdate` a `prompt` (`vite.config.ts` + `UpdatePrompt.tsx`)
Cambiar `registerType: "prompt"` para que las actualizaciones del SW **no recarguen la página automáticamente** mientras la profesora está trabajando. El `UpdatePrompt` ya maneja esto con un botón manual — solo necesitamos que el registro no fuerce el update.

### 3. Agregar logging diagnóstico (`useDebounceCallback`)
En el `catch` del debounce, loguear el error a consola con timestamp y contexto para poder diagnosticar qué está fallando exactamente.

### 4. Agregar logging en el SW registration (`UpdatePrompt.tsx`)
Agregar logs cuando el SW se registra, cuando detecta update, y cuando se activa, para tener trazabilidad del ciclo de vida.

### Archivos a modificar
- `vite.config.ts` — runtimeCaching method filter + registerType prompt
- `src/hooks/useDebounce.ts` — logging en catch
- `src/components/UpdatePrompt.tsx` — logging de ciclo de vida del SW

