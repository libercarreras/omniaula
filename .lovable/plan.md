

## Plan: Auto-update silencioso con toast breve

### Situacion actual
- `vite.config.ts` ya tiene `skipWaiting: true` y `clientsClaim: true` en workbox, pero `registerType: "prompt"` fuerza el popup manual.
- `UpdatePrompt.tsx` muestra un banner grande con botones "Actualizar" / "Mas tarde".

### Cambios

**1. `vite.config.ts`** — Cambiar `registerType` de `"prompt"` a `"autoUpdate"`
- Esto hace que el SW se active automaticamente sin intervencion del usuario.

**2. `src/components/UpdatePrompt.tsx`** — Reemplazar el banner completo por un componente que:
- Usa `useRegisterSW` con `onRegisteredSW` para detectar cuando hay un SW esperando.
- Llama `updateServiceWorker(true)` automaticamente al detectar nueva version.
- Muestra un `toast.success("App actualizada")` breve via sonner despues de recargar.
- Ya no renderiza ningun UI (return null siempre).

**3. Sin otros archivos afectados** — `App.tsx` ya importa `<UpdatePrompt />` y `<Sonner />`.

### Resultado
Al detectar nueva version, el SW se activa solo y la pagina se recarga. Al volver, aparece un toast breve "App actualizada a la ultima version" que desaparece en 3 segundos.

