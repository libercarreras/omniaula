

## Convertir OmniAula en PWA — Análisis de viabilidad

### Respuesta corta
Es **totalmente viable** y de bajo riesgo. La app ya es mobile-first, usa Vite, y no depende de funcionalidades incompatibles con PWA. No se rompería ninguna funcionalidad existente.

### Qué se gana con PWA
- **Instalable** desde el navegador (icono en pantalla de inicio, sin app store)
- **Carga offline parcial**: shell de la app carga sin conexión; los datos requieren conexión pero se puede mostrar estado offline
- **Rendimiento**: cache de assets estáticos (JS, CSS, imágenes) = cargas subsiguientes casi instantáneas
- **Experiencia nativa**: sin barra de navegador, splash screen personalizado

### Qué NO se rompe
- Autenticación (Supabase auth funciona igual en PWA)
- Todas las páginas y navegación (React Router SPA compatible)
- Edge functions y consultas a base de datos
- Tema oscuro/claro
- Responsive design existente

### Qué requiere cuidado
- La ruta `/~oauth` debe excluirse del service worker para que los flujos de autenticación con providers externos funcionen
- El service worker debe usar estrategia **network-first** para las llamadas API a Supabase
- Assets estáticos pueden usar **cache-first** sin problema

### Cambios técnicos necesarios

1. **Instalar `vite-plugin-pwa`** como dependencia
2. **Configurar en `vite.config.ts`**: registrar el plugin con manifest, iconos, y `navigateFallbackDenylist: [/^\/~oauth/]`
3. **Agregar iconos PWA** (192x192 y 512x512) en `/public`
4. **Agregar meta tags** en `index.html`: `theme-color`, `apple-mobile-web-app-capable`, link al manifest
5. **Opcional**: crear página `/instalar` con instrucciones y botón de instalación

### Estimación
- Complejidad: baja
- Archivos a modificar: 2 (`vite.config.ts`, `index.html`)
- Archivos a crear: 1-2 (iconos, página de instalación opcional)
- Riesgo de romper funcionalidad: mínimo

