

## Problem diagnosis

The attendance data shows "Guardado" but doesn't persist because of a **stale closure bug**. Here's what happens:

1. User clicks "presente" on a student
2. `marcar()` calls `setAsistencia(prev => ...)` and `trigger()`
3. But `trigger()` captures `saveAsistenciaFn` which itself captured `asistencia` from state
4. Since React state updates are batched, `asistencia` still has the OLD value (without the new change) when `trigger` runs
5. The timeout fires 1.5s later with the stale `asistencia` -- the new mark is missing
6. The save executes with empty/incomplete data, so nothing is actually persisted

Additionally, each time `callback` changes (every render due to `asistencia` dependency), `trigger` is recreated, which cancels the previous timer and creates a new one. But the final timer still captures a potentially stale state.

## Fix

**1. Update `useDebounce.ts`** to use a callback ref pattern instead of depending on `callback` directly. This ensures the timeout always calls the *latest* version of the callback:

```typescript
const callbackRef = useRef(callback);
callbackRef.current = callback; // always fresh

const trigger = useCallback(() => {
  setStatus("pending");
  if (timerRef.current) clearTimeout(timerRef.current);
  timerRef.current = setTimeout(async () => {
    setStatus("saving");
    try {
      await callbackRef.current(); // uses latest callback
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("idle");
    }
  }, delay);
}, [delay]); // no callback dependency
```

**2. Update `Asistencia.tsx`** `saveAsistenciaFn` to also use a ref for `asistencia` state, ensuring the save function always reads the latest value:

```typescript
const asistenciaRef = useRef(asistencia);
asistenciaRef.current = asistencia;

const saveAsistenciaFn = useCallback(async () => {
  const currentAsistencia = asistenciaRef.current;
  // ... use currentAsistencia instead of asistencia
}, [claseSeleccionada, user, hoyISO]); // remove asistencia dependency
```

This same ref pattern should be applied wherever `useDebounceCallback` is used (e.g., `ModoClase.tsx` diary save).

## Files to modify
- `src/hooks/useDebounce.ts` -- callback ref pattern
- `src/pages/Asistencia.tsx` -- asistencia ref for save function

