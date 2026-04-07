

## Diagnóstico: Por qué el icono personalizado no funciona al instalar

El problema es una desconexión entre dos sistemas:

1. **Build time**: `vite-plugin-pwa` genera el manifest estáticamente con rutas fijas (`/pwa-icon-192.png`, `/pwa-icon-512.png`) que apuntan a los iconos por defecto en `/public`.

2. **Runtime**: El icono que subís en Configuración se guarda en Supabase Storage y se registra en `app_settings`, pero **nada conecta eso con el manifest que el navegador usa para instalar**.

3. **Edge Function `dynamic-manifest`**: Existe y lee los iconos personalizados de `app_settings`, pero **nunca se usa** — ningún código en la app apunta al manifest dinámico.

En resumen: subís el icono, se guarda bien, se muestra en la preview de Configuración, pero el manifest real que Chrome lee al instalar sigue teniendo los iconos por defecto.

## Plan de corrección

### 1. `src/main.tsx` — Inyectar manifest dinámico al arrancar

Después de renderizar la app, agregar lógica que:
- Consulte `app_settings` para ver si hay iconos personalizados (`pwa_icon_192`, `pwa_icon_512`)
- Si existen, reemplace el `href` del `<link rel="manifest">` existente (generado por vite-plugin-pwa) por la URL de la Edge Function `dynamic-manifest`
- Si no existen, dejar el manifest estático por defecto (no tocar nada)

```text
Flujo:
1. App carga → vite-plugin-pwa inyecta manifest estático
2. main.tsx consulta app_settings → ¿hay iconos custom?
   SÍ → reemplaza <link rel="manifest"> href → Edge Function URL
   NO → no hace nada (usa iconos por defecto)
```

### 2. `supabase/functions/dynamic-manifest/index.ts` — Sin cambios

Ya funciona correctamente: lee los iconos de `app_settings` y genera el manifest con las URLs de Storage.

### 3. `src/components/admin/ConfiguracionTab.tsx` — Pequeña mejora

Después de subir el icono exitosamente, agregar una nota informativa al usuario: "El nuevo icono se aplicará la próxima vez que alguien instale la app" (ya que los dispositivos que ya instalaron no actualizan el icono automáticamente).

### Archivos a modificar
- `src/main.tsx` — agregar inyección dinámica del manifest
- `src/components/admin/ConfiguracionTab.tsx` — mensaje informativo post-upload

### Resultado
- Al instalar la app, Chrome usará el icono personalizado subido desde Configuración
- Si no hay icono personalizado, sigue usando los por defecto sin cambios
- La Edge Function ya desplegada hace el trabajo pesado

