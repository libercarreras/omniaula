

## Plan: Imprimir / Guardar PDF en Evaluaciones

### Objetivo
Agregar botón "Imprimir / PDF" en dos lugares:
1. **Paso 3 del wizard** (antes de crear, para imprimir la vista previa)
2. **Sheet de detalle** (después de creada la evaluación)

### Enfoque
Usar `window.print()` con una hoja de estilos `@media print` dedicada. Se renderiza un contenedor oculto con formato de examen limpio (encabezado con nombre, materia, grupo, fecha, preguntas numeradas, espacio para respuestas) y se imprime. El navegador permite guardar como PDF nativamente.

### Cambios en `src/pages/Evaluaciones.tsx`

**1. Función `printEvaluacion`** que:
- Crea un `iframe` temporal invisible
- Escribe HTML formateado con: título, materia, grupo, fecha, preguntas numeradas
- Para múltiple opción: muestra opciones A), B), C), D) sin marcar la correcta (es para el alumno)
- Para preguntas abiertas: deja líneas vacías para responder
- Llama `iframe.contentWindow.print()` y limpia

**2. Paso 3 del wizard** -- agregar botón "Imprimir vista previa" junto a "Crear evaluación" (solo visible si hay preguntas)

**3. Detail Sheet** -- agregar botón "Imprimir" en el header del sheet, visible cuando hay contenido

### Formato de impresión
```text
┌──────────────────────────────────┐
│  [Nombre evaluación]             │
│  Materia: X  |  Grupo: Y        │
│  Fecha: DD/MM/YYYY               │
│  Nombre: ________________        │
│                                  │
│  1. [Enunciado]          (X pts) │
│     A) opción                    │
│     B) opción                    │
│     C) opción                    │
│     D) opción                    │
│                                  │
│  2. [Enunciado abierta]  (X pts) │
│     _____________________________│
│     _____________________________│
└──────────────────────────────────┘
```

### Archivos
| Archivo | Cambio |
|---|---|
| `src/pages/Evaluaciones.tsx` | Agregar función `printEvaluacion`, botones en paso 3 y detail sheet |

