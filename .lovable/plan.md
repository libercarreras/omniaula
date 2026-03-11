

## Plan: Pestaña Configuración en Administración con cambio de icono PWA

### Objetivo
Agregar una pestaña "Configuración" en la página de Administración (solo visible para el super admin) que permita subir un nuevo icono para la PWA.

### Cambios en base de datos
1. **Tabla `app_settings`** (key-value global, sin user_id):
   - `id uuid PK`, `key text UNIQUE`, `value text`, `updated_at timestamptz`
   - RLS: SELECT público para todos los autenticados, INSERT/UPDATE solo admin vía `has_role()`

2. **Bucket de storage `app-assets`** (público):
   - Para almacenar los iconos PWA subidos
   - Políticas: solo admin puede subir/eliminar, lectura pública

### Cambios en edge functions
3. **`supabase/functions/dynamic-manifest/index.ts`** — nueva edge function que sirve un `manifest.webmanifest` dinámico:
   - Lee de `app_settings` las URLs de iconos personalizados
   - Si no hay personalización, devuelve los iconos por defecto (`/pwa-icon-192.png`, `/pwa-icon-512.png`)
   - Responde con `Content-Type: application/manifest+json`

### Cambios en frontend
4. **`src/pages/Administracion.tsx`** — agregar Tabs (Usuarios | Configuración):
   - Tab "Usuarios": contenido actual sin cambios
   - Tab "Configuración": card con preview del icono actual + botón para subir nuevo (acepta PNG, mín 512x512)
   - Al subir: guarda en storage `app-assets/pwa-icon.png`, actualiza `app_settings` con la URL pública, muestra preview

5. **`index.html`** — cambiar el `<link rel="manifest">` para apuntar a la edge function dinámica en lugar del manifest estático generado por vite-plugin-pwa

6. **`vite.config.ts`** — desactivar la generación de manifest del plugin PWA (mantener solo el service worker), ya que el manifest será servido dinámicamente

### Flujo
1. Admin va a Administración → Configuración
2. Ve el icono actual, sube uno nuevo (PNG)
3. Se guarda en storage y se registra en `app_settings`
4. La próxima vez que un usuario instale/actualice la PWA, obtiene el manifest dinámico con el nuevo icono

