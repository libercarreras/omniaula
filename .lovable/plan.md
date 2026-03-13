

## Diagnóstico: Crash al confirmar motivo de retiro

La imagen muestra el ErrorBoundary ("Algo salió mal") activándose al confirmar el motivo del retiro. Esto ocurre en la Chromebook de la cliente.

### Causa probable

El componente `Dialog` de Radix (usado para el motivo de retiro) aplica **focus trap + scroll lock + portal** al abrirse. En ChromeOS/Android, cuando se combina con:
1. `autoFocus` en el `Textarea` dentro del Dialog (conflicto conocido con teclado virtual en Android/ChromeOS)
2. La animación de cierre del Dialog ejecutándose simultáneamente con el re-render del listado de 30+ estudiantes tras el `setState`

Esto genera una excepción en el ciclo de render que el ErrorBoundary captura.

### Solución

**Archivo: `src/components/clase/tabs/AsistenciaTab.tsx`**

1. Eliminar `autoFocus` del `Textarea` — causa conflictos con el teclado virtual en ChromeOS/Android
2. Cerrar el Dialog **antes** de llamar a `onMarcarAsistencia` para evitar que el re-render del listado colisione con la animación de cierre del portal de Radix
3. Agregar un pequeño `setTimeout` para separar el cierre del Dialog del state update

**Archivo: `src/pages/Asistencia.tsx`**

Aplicar los mismos cambios al flujo de retiro en la página standalone de Asistencia:
1. Eliminar `autoFocus`
2. Separar cierre de Dialog de la actualización de estado

### Cambio clave en `confirmRetiro`

```typescript
const confirmRetiro = () => {
  if (!retiroDialog) return;
  const { estId } = retiroDialog;
  const motivo = retiroMotivo.trim();
  // Close dialog FIRST to avoid render collision
  setRetiroDialog(null);
  setRetiroMotivo("");
  // Then update state after dialog portal unmounts
  requestAnimationFrame(() => {
    onMarcarAsistencia(estId, "retiro", motivo);
  });
};
```

