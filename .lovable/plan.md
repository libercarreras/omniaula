

## Add "Parcial" button to timeline items

Currently the timeline items in `PlanificacionTimeline.tsx` only show 2 status buttons: "completado" and "suspendido". The user wants to add "parcial" as a third option that marks the topic as partially completed without rescheduling it.

### Changes needed in `src/components/programa/PlanificacionTimeline.tsx`:

1. **Add "parcial" to the status buttons array** (line 338): Change `["completado", "suspendido"]` to `["completado", "parcial", "suspendido"]`.

2. **Prevent rescheduling for "parcial"**: The `updateEstado` function already only triggers `redistributePending` when `newEstado === "suspendido"`, so "parcial" will NOT cause rescheduling -- this already works correctly.

3. **Visual styling for "parcial" topic text** (around line 328): The topic text currently gets `line-through` for completado and suspendido. For "parcial", no line-through should be applied (it was given, just not fully), so no change needed there -- it will show normally like "pendiente".

That's it -- a single line change to add the button, and the existing logic already handles "parcial" correctly (no rescheduling, counted at 0.5 in progress stats).

