

## Problema

El PWA dejó de ser instalable. Hay dos conflictos:

1. **Manifest duplicado**: `index.html` tiene `<link rel="manifest" href="/manifest.webmanifest" />` que apunta al archivo estático, pero `vite-plugin-pwa` genera su propio manifest en build. Dos manifests compiten y confunden al navegador.

2. **Sin guard para preview/iframe**: El service worker se registra dentro del iframe de Lovable, lo que rompe el PWA en desarrollo y puede contaminar caches.

## Cambios

### 1. `index.html` — Quitar el manifest link manual

Eliminar la línea `<link rel="manifest" href="/manifest.webmanifest" />`. `vite-plugin-pwa` inyecta el suyo automáticamente en el build.

### 2. `vite.config.ts` — Agregar `devOptions: { enabled: false }`

Asegurar que el SW no se registre en desarrollo (preview de Lovable).

### 3. `src/main.tsx` — Guard contra iframe/preview

Agregar la lógica estándar para desregistrar service workers cuando se ejecuta dentro del iframe de Lovable o en dominios de preview:

```typescript
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com");

if (isPreviewHost || isInIframe) {
  navigator.serviceWorker?.getRegistrations().then(regs =>
    regs.forEach(r => r.unregister())
  );
}
```

### 4. Eliminar `manifest.webmanifest` (archivo raíz)

Ya no se usa — todo sale de `vite-plugin-pwa`.

### Resultado
- En producción (`omniaula.lovable.app`): manifest correcto, SW activo, `beforeinstallprompt` se dispara, botón "Instalar app" aparece
- En preview de Lovable: SW desactivado, sin interferencia
- `UpdatePrompt` e `InstallBanner`/`InstallPWAButton` siguen funcionando como antes

