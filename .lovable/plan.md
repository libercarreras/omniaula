

## Plan: Reemplazar input de horario por selectores desplegables

### Cambio
Reemplazar el campo de texto libre "Horario (opcional)" por **dos selectores desplegables**: uno para la hora de inicio y otro para la hora de fin.

### Diseño UI

```text
Horario (opcional)
┌──────────────┐    ┌──────────────┐
│ Hora inicio ▾│  — │ Hora fin   ▾ │
│  8:00        │    │  9:30        │
└──────────────┘    └──────────────┘
```

- Opciones de hora: 7:00 a 22:00 en intervalos de 30 minutos
- Ambos opcionales — si no se selecciona ninguno, no se guarda horario
- Placeholder: "Inicio" / "Fin"

### Cambios técnicos

**`src/pages/ModoClase.tsx`**:
1. Reemplazar `editHora` (string) por `editHoraInicio` y `editHoraFin` (strings)
2. Actualizar `parseHorarioToState` para extraer hora inicio y fin por separado del formato "8:00-9:30"
3. Actualizar `buildHorarioString` para combinar ambos valores: `"8:00-9:30"` o solo inicio si no hay fin
4. Reemplazar el `<Input>` por dos `<Select>` de shadcn lado a lado con las opciones de horarios generadas (7:00, 7:30, 8:00... 22:00)

No se requieren cambios en base de datos — el campo `horario` sigue siendo texto libre, solo cambia cómo se construye.

