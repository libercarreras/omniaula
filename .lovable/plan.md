
Objetivo: resolver dos síntomas relacionados en Modo Clase para la docente **karencarreras@gmail.com**:
1) sigue crasheando al confirmar el motivo de retiro temprano,  
2) la pestaña “Asist.” aparece como “Ayuda”.

Diagnóstico (con logs revisados)
- En logs de autenticación del backend, la usuaria inicia sesión correctamente (sin errores).
- En logs de base de datos no aparecen errores de inserción para asistencia en ese período.
- En datos recientes no hay registros `retiro` guardados para esa usuaria, lo que confirma que el fallo ocurre **antes** de persistir.
- El cambio visual “Asist.” → “Ayuda” es una señal fuerte de **traducción automática del navegador** sobre el DOM.  
- Esa traducción automática puede mutar nodos de texto y romper reconciliación de React (crash capturado por ErrorBoundary), especialmente al cerrar diálogos y re-renderizar listas.

Plan de implementación
1) Bloquear traducción automática global (raíz del problema)
- `index.html`
  - Cambiar `lang="en"` a `lang="es"`.
  - Agregar meta de no traducción (`google notranslate`) y contenido de idioma español.
- `src/main.tsx`
  - Reforzar en runtime `document.documentElement.lang = "es"` y marca de no traducción en raíz.

2) Blindar textos críticos que hoy se están mutando
- `src/components/clase/ClaseHeader.tsx`
  - Envolver labels cortos de tabs (`Asist.`, `Desemp.`, etc.) en `<span translate="no" className="notranslate">...`.
- `src/components/clase/tabs/AsistenciaTab.tsx`
  - Marcar textos cortos/estados y contenido sensible del diálogo con `translate="no"` donde aplique.
- `src/components/clase/tabs/DesempenoTab.tsx`
  - Mantener y extender protección `translate="no"` en celdas/abreviaturas para evitar mutaciones.

3) Endurecer flujo de confirmación de retiro (defensivo)
- Conservar secuencia actual (cerrar diálogo → limpiar estado → `requestAnimationFrame` → actualizar asistencia).
- Agregar guardas extra para evitar ejecución doble del confirmado en Android/Chromebook (tap duplicado).
- Mantener el guardado desacoplado del cierre del portal del diálogo.

4) Mejorar trazabilidad del crash en producción
- `src/components/ErrorBoundary.tsx` y `src/main.tsx`
  - Ampliar logs con contexto de traducción (`documentElement.lang`, `translate`, `navigator.language`) para distinguir fallos por DOM mutado.
  - Dejar huella clara del tipo de excepción cuando sea `removeChild/insertBefore` o similar.

Validación (QA)
- Android + Chromebook:
  - Verificar que la pestaña siga mostrando “Asist.” (no “Ayuda”).
  - Marcar “retiro”, escribir motivo, confirmar, y comprobar que:
    - no aparece “Algo salió mal”,
    - el motivo se muestra en la fila,
    - al recargar sigue persistido.
- Repetir 3–5 veces seguidas para descartar regresión intermitente.

Detalles técnicos (resumen)
- Causa principal probable: traducción automática de navegador sobre una SPA React + cierres de diálogo con re-render de lista.
- Evidencia: texto mutado en UI (“Asist.”→“Ayuda”), ausencia de errores backend y ausencia de registros `retiro` persistidos.
- Alcance: solo frontend, sin cambios de esquema de base de datos.
