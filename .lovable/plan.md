

## Diagnóstico

El problema es una **condición de carrera**: Chrome en la Chromebook detecta el manifiesto estático, muestra brevemente el prompt de instalación, pero luego el código en `main.tsx` reemplaza el `<link rel="manifest">` con un Blob URL dinámico. Chrome re-evalúa el manifiesto y descarta el prompt de instalación nativo.

## Solución

Implementar un **botón de instalación manual** capturando el evento `beforeinstallprompt`, que es la forma estándar y robusta de manejar la instalación PWA. Esto funciona independientemente de si Chrome muestra o esconde su UI nativa.

### Cambios

1. **Crear `src/hooks/useInstallPrompt.ts`** — Hook que:
   - Escucha el evento `beforeinstallprompt` y lo guarda en un ref
   - Escucha `appinstalled` para saber si ya se instaló
   - Expone `canInstall` (boolean) y `promptInstall()` (función)

2. **Crear `src/components/InstallBanner.tsx`** — Banner fijo en la parte inferior que aparece cuando `canInstall` es true, con botón "Instalar aplicación" y botón para descartar. Se muestra solo si el usuario no lo descartó previamente (guardado en `localStorage`).

3. **Agregar `<InstallBanner />` en `App.tsx`** — Al lado del `<UpdatePrompt />`.

4. **Retrasar la inyección del manifiesto dinámico** en `main.tsx` — Mover la lógica de reemplazo del manifiesto para que se ejecute **después** de que el service worker se haya registrado (con un `setTimeout` de ~3s), evitando que interfiera con la detección inicial del navegador.

### Flujo resultante

1. La app carga con el manifiesto estático → Chrome detecta PWA instalable
2. Se captura `beforeinstallprompt` → se muestra el banner personalizado
3. Después de 3s, se inyecta el manifiesto dinámico con iconos custom (si existen)
4. El usuario presiona "Instalar" → se dispara el prompt nativo guardado

