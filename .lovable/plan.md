

## Diagnóstico

Actualmente hay dos problemas relacionados:

1. **Crear clase** (en Grupos): usa un `<Input>` de texto libre para el horario ("Ej: Lunes 8:00-9:30"), lo cual es propenso a errores de formato y no coincide con el selector estructurado de días + horas que ya existe en `EditClaseDialog`.

2. **Editar clase** (horario/aula): solo es posible desde Modo Clase (`EditClaseDialog`). Desde Grupos no hay forma de editar una clase existente — solo se puede crear.

Lo correcto es tener ambas opciones: poder editar desde Grupos (donde ves todas las clases de un vistazo) y desde Modo Clase (donde estás trabajando con esa clase).

## Plan

### Archivo: `src/pages/Grupos.tsx`

**A. Mejorar el diálogo "Crear clase"** (líneas 380-383)
- Reemplazar el `<Input>` de texto libre por el mismo sistema de chips de días + selectores de hora que usa `EditClaseDialog` (días como botones toggle + `<Select>` para hora inicio/fin).
- Reutilizar las constantes `DIAS_SEMANA` y `HORA_OPTIONS` de `EditClaseDialog`, extrayéndolas a un archivo compartido o importándolas.

**B. Agregar botón "Editar" en cada clase**
- En cada badge de clase (línea 293-300), agregar un ícono de edición (lápiz) que abra el `EditClaseDialog` existente para esa clase.
- Agregar estado `editClaseTarget` para trackear qué clase se está editando.
- Importar y renderizar `<EditClaseDialog>` con los datos de la clase seleccionada.

### Archivo: `src/components/clase/EditClaseDialog.tsx`

- Exportar `DIAS_SEMANA`, `HORA_OPTIONS` y `buildHorarioString` para reutilizarlos en el diálogo de creación de Grupos.

### Resultado
- **Crear clase**: usa selector estructurado de días y horas (consistente con el resto de la app)
- **Editar clase**: posible tanto desde Grupos (clic en clase → editar) como desde Modo Clase (como ya funciona)
- El formato de horario queda estandarizado en ambos flujos

