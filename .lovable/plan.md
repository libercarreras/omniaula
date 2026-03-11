

## Plan: Conectar la página Planificación del sidebar con los datos reales

### Problema
La página `/planificacion` del sidebar es un placeholder vacío que no muestra ninguna información. La planificación real ya existe en la base de datos (`planificacion_clases`) y se gestiona desde Modo Clase, pero no hay forma de ver un panorama general.

### Solución
Transformar la página Planificación en un **dashboard de planificación** que muestre el estado de avance de todas las clases del docente, con acceso directo al Modo Clase de cada una.

### Diseño UI

```text
Planificación
─────────────────────────────────────────────
┌─ Matemáticas · 3°A ──────────────────────┐
│  ████████████░░░░░  68% completado        │
│  12/18 temas · 2 suspendidos              │
│                            [Ir a clase →] │
└───────────────────────────────────────────┘
┌─ Física · 2°A ───────────────────────────┐
│  ░░░░░░░░░░░░░░░░░  Sin programa cargado │
│                            [Ir a clase →] │
└───────────────────────────────────────────┘
```

Cada tarjeta muestra:
- Nombre de materia + grupo
- Barra de progreso con % de temas completados/parciales
- Contadores: completados, pendientes, suspendidos
- Botón para navegar al Modo Clase (sección programa)

Si no hay clases, se mantiene el estado vacío actual.

### Cambios técnicos

**`src/pages/Planificacion.tsx`** — reescribir completamente:
1. Fetch de todas las clases del usuario (join con materias y grupos)
2. Fetch de `planificacion_clases` agrupado por `clase_id` para calcular estadísticas
3. Renderizar cards con `Progress` bar y contadores por estado
4. Botón "Ir a clase" que navega a `/clase/:claseId`
5. Estado vacío si no hay clases creadas

No se requieren cambios en base de datos ni en otros archivos.

