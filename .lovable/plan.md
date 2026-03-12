

## Problema actual

El Programa Anual y la Planificación están escondidos dentro de un Dialog accesible solo mediante un pequeño botón de icono (`FileText`) en el header, y solo aparece si ya existe una estructura guardada. Esto hace que sea prácticamente invisible. Además, la relación entre Planificación y Diario es débil: solo se muestra el tema planificado como sugerencia, pero no hay navegación bidireccional ni contexto de progreso.

## Propuesta: Pestaña "Programa" integrada + Diario enriquecido

### 1. Nueva pestaña "Programa" en el tab bar (reemplaza el Dialog)

Agregar una séptima pestaña al tab bar del Modo Clase llamada **"Prog."** con el icono `FileText`. Esta pestaña contendrá todo lo que hoy está en el Dialog:

- Carga del contenido del programa (texto + archivo)
- Estructura generada por IA (`EstructuraPrograma`)
- Timeline de planificación (`PlanificacionTimeline`)

Esto elimina la necesidad del Dialog y del botón en el header. El programa queda al mismo nivel que las demás secciones operativas.

### 2. Integración Diario ↔ Planificación

Enriquecer la pestaña **Diario** con contexto de planificación:

- **Bloque de progreso compacto**: Debajo del tema sugerido, mostrar una mini barra de progreso del programa (ej: "12 de 30 temas completados — 40%") con un link para ir a la pestaña Programa.
- **Estado del tema de hoy**: Dentro del Diario, permitir marcar el estado del tema planificado (Completado / Parcial / Suspendido) sin tener que ir a la pestaña Programa. Actualmente esto se auto-marca al guardar el tema, pero el docente no tiene control directo.
- **Navegación cruzada**: Botón "Ver planificación completa" que lleva a la pestaña Programa.

### 3. Resumen también muestra progreso del programa

En la pestaña Resumen, agregar una card de "Progreso del programa" con la barra de progreso y un acceso directo a la pestaña Programa.

### Cambios técnicos

| Archivo | Cambio |
|---|---|
| `src/components/clase/types.ts` | Agregar `"programa"` al tipo `ModoActivo` y badge correspondiente |
| `src/components/clase/ClaseHeader.tsx` | Agregar pestaña "Prog." al array `modos`, eliminar botón FileText del header |
| `src/pages/ModoClase.tsx` | Mover contenido del Dialog de programa al render condicional de `modoActivo === "programa"`. Crear componente inline o nuevo `ProgramaTab`. Eliminar el Dialog de programa. Pasar stats de planificación al DiarioTab y ResumenTab |
| `src/components/clase/tabs/DiarioTab.tsx` | Agregar bloque de progreso de planificación y botones de estado del tema de hoy |
| `src/components/clase/tabs/ResumenTab.tsx` | Agregar card de progreso del programa con link a pestaña "programa" |
| `src/components/clase/tabs/ProgramaTab.tsx` | Nuevo componente que encapsula la carga de programa, estructura y timeline |

### Layout del tab bar (7 tabs → grid-cols-7)

```text
[ Resumen | Asist. | Desemp. | Notas | Obs. | Diario | Prog. ]
```

Ya usa `grid-cols-7` pero solo hay 6 pestañas, por lo que encaja perfecto.

