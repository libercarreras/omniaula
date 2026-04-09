
Diagnóstico

- El PWA base no está roto por `vite.config.ts`: los iconos estáticos existen en `public/` y el manifest actual apunta a `/pwa-icon-192.png` y `/pwa-icon-512.png`, que es correcto.
- La regresión viene del intento de icono dinámico en `src/main.tsx`: si existe `app_settings.pwa_icon_*`, la app reemplaza el manifest del sitio por `dynamic-manifest`.
- La red confirma que esa condición hoy se cumple: existe al menos `pwa_icon_192` en `app_settings`, así que la app entra en ese camino siempre.
- Ese enfoque es frágil porque cambia el manifest en runtime y además lo apunta a una URL externa al origen publicado. Eso es lo más probable que haya roto la instalabilidad y hecho desaparecer `beforeinstallprompt`.
- También hay lógica duplicada para instalación (`InstallPWAButton` y `InstallBanner`). No parece ser la causa raíz, pero sí complica el flujo.

Plan

1. `src/main.tsx`
- Eliminar completamente la inyección dinámica del manifest.
- Dejar que el manifest lo maneje solo `vite-plugin-pwa`.

2. `vite.config.ts`
- Mantener el manifest estático actual con rutas same-origin:
  - `/pwa-icon-192.png`
  - `/pwa-icon-512.png`
- Mantener `includeAssets: ["favicon.ico"]` y `devOptions: { enabled: false }`.

3. `src/components/admin/ConfiguracionTab.tsx`
- Desacoplar el upload del icono de la instalación real del PWA para que no vuelva a romperlo.
- Opción más segura: dejar el bloque visible pero aclarar que hoy no cambia el icono instalado.
- Alternativa aún más segura: ocultar temporalmente la personalización del icono hasta rehacerla bien.

4. Flujo de instalación
- Unificar en una sola implementación:
  - conservar `useInstallPrompt` + `InstallBanner`, o
  - conservar `InstallPWAButton` pero usando el mismo hook compartido.
- Quitar listeners duplicados de `beforeinstallprompt`.

5. Robustez en preview
- Evitar registro del service worker en preview/iframe para que el editor no quede afectado por caché vieja.

Detalle técnico

```text
Estado actual:
app publicada
 -> manifest estático correcto
 -> main.tsx detecta pwa_icon_* en app_settings
 -> reemplaza el manifest por dynamic-manifest
 -> la instalabilidad deja de ser confiable

Estado buscado:
app publicada
 -> un solo manifest same-origin
 -> iconos fijos del build
 -> beforeinstallprompt vuelve a aparecer
```

Resultado esperado

- Se recupera la instalabilidad del PWA.
- Vuelve a dispararse `beforeinstallprompt` en la app publicada.
- El intento fallido de icono personalizado deja de afectar el PWA.
- La personalización del icono queda pausada hasta implementarla con una estrategia same-origin real.
