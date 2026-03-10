

## Plan: Evaluaciones -- Botón funcional + Generación inteligente con IA

### Problema actual
El botón "Nueva evaluación" no tiene `onClick` handler -- es un botón muerto.

### Solución propuesta

#### 1. Crear formulario de nueva evaluación con flujo inteligente

Un Dialog/Sheet con un wizard de 3 pasos:

**Paso 1 -- Seleccionar clase y periodo**
- Select de grupo (filtra clases disponibles)
- Select de clase (materia asociada al grupo)
- Rango de fechas "Desde / Hasta" para delimitar el periodo evaluado
- Al seleccionar clase + rango, se carga automáticamente:
  - Temas del programa dados en ese periodo (de `planificacion_clases` con estado completado/parcial)
  - Clases dictadas en ese rango (del `diario_clase`)
  - Progreso del programa (%)

**Paso 2 -- Modalidad de generación**
4 opciones presentadas como cards seleccionables:
- **Manual**: Solo crea la evaluación vacía (nombre, tipo, fecha, peso). El docente carga todo.
- **Auto-preguntas**: IA genera preguntas abiertas/de desarrollo basadas en los temas del periodo.
- **Auto-múltiple opción**: IA genera preguntas de opción múltiple con distractores.
- **Mixta**: IA genera una combinación de ambas.

Para las 3 opciones con IA, el docente puede configurar:
- Cantidad de preguntas (5, 10, 15, 20)
- Dificultad (básico, intermedio, avanzado)

**Paso 3 -- Revisión y confirmación**
- Preview de la evaluación generada (o formulario manual)
- Nombre, tipo, fecha, peso
- Botón "Crear evaluación"

#### 2. Nueva tabla `evaluacion_contenido` para almacenar preguntas generadas

```sql
CREATE TABLE public.evaluacion_contenido (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluacion_id uuid NOT NULL REFERENCES evaluaciones(id) ON DELETE CASCADE,
  orden integer NOT NULL DEFAULT 0,
  tipo_pregunta text NOT NULL DEFAULT 'abierta', -- 'abierta', 'multiple_opcion'
  enunciado text NOT NULL,
  opciones jsonb, -- para multiple opcion: [{texto, correcta}]
  puntos numeric DEFAULT 1,
  user_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);
-- RLS: user_id = auth.uid()
```

#### 3. Edge function `generate-evaluation`

Recibe: temas del periodo, modalidad, cantidad, dificultad.
Usa Lovable AI (gemini-3-flash-preview) con tool calling para retornar JSON estructurado de preguntas.

#### 4. Vista de evaluación existente

Al hacer click en una evaluación de la lista, abrir un sheet/dialog que muestre:
- Detalle de la evaluación (nombre, tipo, fecha, clase)
- Lista de preguntas generadas (si las hay)
- Tabla de notas por estudiante

### Archivos a crear/modificar

| Archivo | Cambio |
|---|---|
| **Migration SQL** | Crear tabla `evaluacion_contenido` |
| `supabase/functions/generate-evaluation/index.ts` | Edge function para generar preguntas con IA |
| `src/pages/Evaluaciones.tsx` | Reescribir completo: wizard de creación, lista mejorada, vista detalle |

### Orden de implementación
1. Migration (tabla evaluacion_contenido)
2. Edge function generate-evaluation
3. Evaluaciones.tsx: wizard completo + lista + detalle

