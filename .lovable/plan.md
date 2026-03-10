

## Plan: Fix notas persistence bug

### Root Cause
In `saveNotasFn` (line 285), the code does:
```js
const [evaluacion_id, estudiante_id] = key.split("-");
```
The key format is `${evaluacion_id}-${estudiante_id}` where both are UUIDs (e.g. `1aad1e18-971a-4325-92b6-d7b5b93e93bd-2bcd3e4f-5678-...`). `split("-")` produces 10+ segments, so only the first segment is taken as `evaluacion_id` (e.g. `1aad1e18`) and the second as `estudiante_id` (e.g. `971a`). Both are wrong, the DB query finds nothing, and the insert fails due to invalid UUIDs.

### Fix
Since UUIDs are always 36 characters, extract them by position:
```js
const evaluacion_id = key.substring(0, 36);
const estudiante_id = key.substring(37);
```

### Files to modify
| File | Change |
|---|---|
| `src/pages/ModoClase.tsx` | Fix line 285: replace `split("-")` with `substring` |

Single-line fix, no other changes needed.

