

## Plan: Sistema de Desempeño Diario

### Problema actual
La pestaña de Asistencia mezcla dos conceptos distintos: presencia física y evaluación de participación (A/M/B). Además, las categorías reales de evaluación diaria son 4: **Tarea Domiciliaria**, **Participación Oral**, **Rendimiento en Aula** y **Conducta**, con escala **B / M / A / A+**.

### Solución

**1. Separar asistencia de desempeño**: Quitar los botones A/M/B de la pestaña Asistencia (tanto en ModoClase como en la página Asistencia standalone). La pestaña Asistencia queda limpia: solo Presente/Falta/Tarde/Retiro.

**2. Nueva pestaña "Desempeño"** en Modo Clase con una grilla compacta por alumno:

```text
┌─────────────────────┬──────┬──────┬──────┬──────┐
│ Alumno              │ Tarea│ Oral │ Rend.│ Cond.│
├─────────────────────┼──────┼──────┼──────┼──────┤
│ García, Lucía       │  A   │  A+  │  M   │  A   │
│ López, Martín       │  B   │  M   │  B   │  M   │
└─────────────────────┴──────┴──────┴──────┴──────┘
```

Cada celda es un botón que cicla entre: vacío → B → M → A → A+ → vacío. Colores: B=rojo, M=amarillo, A=verde, A+=azul/destacado.

### Cambios en base de datos

**Nueva tabla `desempeno_diario`**:
- `id` uuid PK
- `clase_id` uuid NOT NULL
- `estudiante_id` uuid NOT NULL
- `fecha` date NOT NULL
- `user_id` uuid NOT NULL
- `tarea` text nullable (B/M/A/A+)
- `participacion_oral` text nullable
- `rendimiento_aula` text nullable
- `conducta` text nullable
- `created_at`, `updated_at`
- UNIQUE(clase_id, estudiante_id, fecha)

RLS: CRUD filtrado por `auth.uid() = user_id`.

La tabla `participacion_clase` existente queda sin uso (no se elimina por seguridad, pero se deja de usar).

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| **Migración SQL** | Crear tabla `desempeno_diario` con RLS |
| `src/components/clase/types.ts` | Agregar tipo `NivelDesempeno`, nuevo `ModoActivo = "desempeno"`, quitar `NivelParticipacion` del uso |
| `src/components/clase/tabs/AsistenciaTab.tsx` | Eliminar sección A/M/B (participación), simplificar props |
| `src/components/clase/tabs/DesempenoTab.tsx` | **Nuevo** — grilla compacta con 4 categorías × ciclo B/M/A/A+ |
| `src/pages/ModoClase.tsx` | Agregar pestaña "Desempeño", estado + fetch/save de `desempeno_diario`, quitar lógica de `participacion_clase` |
| `src/components/clase/ClaseHeader.tsx` | Agregar tab "Desempeño" en la barra de pestañas |
| `src/pages/Asistencia.tsx` | Sin cambios (ya no tiene A/M/B) |
| `src/components/clase/tabs/ResumenTab.tsx` | Reemplazar stats de participación por stats de desempeño |

### UX de la grilla

- Header fijo con iconos/abreviaturas de cada categoría (📝 Tarea, 🗣 Oral, 📊 Rend., 🤝 Cond.)
- Click en celda cicla el valor. Tooltip muestra el nombre completo de la categoría + nivel
- Botón "Marcar todos A" como acción rápida
- Auto-guardado con debounce (mismo patrón existente)

