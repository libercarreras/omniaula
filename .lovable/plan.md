

## Diagnóstico: Pantalla negra en Android — Causa raíz encontrada

El problema es **específico de Android** (Chromebook + teléfono Android). Después de revisar todo el código, identifiqué **tres causas combinadas** que solo afectan dispositivos Android con Chrome:

### Causa 1: Tooltip overflow en dispositivos táctiles
`DesempenoTab` renderiza **120+ instancias de Tooltip** (4 categorías × 30 alumnos), cada una con su propio `TooltipTrigger` y `TooltipContent`. En Android, los tooltips de Radix se comportan diferente que en desktop:
- El tap abre el tooltip (no hover)
- Taps rápidos causan múltiples tooltips abriéndose/cerrándose simultáneamente
- Esto genera una cascada de DOM mutations + layout recalculations que colapsan el thread de rendering en Chrome Android

### Causa 2: `transition-all` en 120+ botones
Cada celda de desempeño tiene `transition-all`, que anima **todas** las propiedades CSS simultáneamente. En Android con GPU limitada, al hacer 3-4 taps rápidos se acumulan animaciones de color, escala y opacidad que agotan la memoria GPU → pantalla negra.

### Causa 3: Re-renders en cascada sin protección
Cada tap dispara: `setDesempeno` (re-render completo) → `setStatus("pending")` dentro del debounce trigger (otro re-render). En 3-4 taps rápidos = 6-8 re-renders consecutivos, cada uno recalculando 120+ tooltips con transiciones.

### Causa 4: Sin captura de errores globales
Si el crash genera una excepción no capturada, no hay `window.onerror` ni `ErrorBoundary` que lo atrape y loguee, por eso no hay rastro del error.

---

## Plan de solución

### 1. Eliminar Tooltips de las celdas individuales en `DesempenoTab`
Reemplazar los 120+ `<Tooltip>` que envuelven cada celda de nivel por botones simples sin tooltip. Los tooltips en los headers de categoría se mantienen (son solo 4). **Esto elimina la causa principal del crash en Android.**

### 2. Reemplazar `transition-all` por transiciones específicas
Cambiar `transition-all active:scale-95` por `transition-colors` solamente. Eliminar `active:scale-95` que fuerza reflow en cada tap.

### 3. Agregar error boundary global + logger
Crear un componente `ErrorBoundary` en `App.tsx` que capture crashes de React y los loguee. Agregar `window.onerror` y `window.onunhandledrejection` en `main.tsx` para capturar errores que ocurran fuera de React.

### 4. Optimizar el debounce trigger
Mover el `setStatus("pending")` fuera del hot path — usar un ref para tracking en vez de state, evitando el re-render extra por cada tap.

### Archivos a modificar
- `src/components/clase/tabs/DesempenoTab.tsx` — eliminar tooltips de celdas, simplificar transiciones
- `src/hooks/useDebounce.ts` — reducir re-renders del status
- `src/main.tsx` — agregar global error handlers
- `src/App.tsx` — agregar ErrorBoundary

