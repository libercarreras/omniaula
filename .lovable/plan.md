

## Plan: Convertir Modo Clase en el core de la aplicación

Tras revisar todo el código, identifiqué varios problemas y oportunidades para hacer de ModoClase la herramienta central del docente.

---

### Problemas actuales

1. **Participación no se guarda** -- El tab "Partic." solo actualiza estado local. Al recargar la página se pierde todo. No existe tabla en la DB ni función de guardado.

2. **Stale closure en asistencia de ModoClase** -- El `saveAsistenciaFn` en ModoClase.tsx no usa el patrón de `useRef` que ya se corrigió en Asistencia.tsx. El mismo bug de "Guardado pero no persiste" puede ocurrir aquí.

3. **Diario no se conecta con Planificación** -- Si hay un tema planificado para hoy, el campo "Tema trabajado" del diario debería auto-completarse. Actualmente el docente tiene que escribirlo manualmente.

4. **No hay vista resumen del día** -- El docente no puede ver de un vistazo qué registró en la clase de hoy (asistencia, notas, observaciones, diario, avance del programa).

5. **StudentDetailSheet es muy básica** -- Solo muestra observaciones. No incluye historial de asistencia, promedio de notas, ni tendencias.

6. **6 tabs apretados** -- "Programa" es más de configuración que de uso diario. Debería separarse o moverse para dar espacio a un tab de resumen.

---

### Cambios propuestos

#### 1. Crear tabla `participacion_clase` y persistir datos
- **Migration SQL**: Crear tabla con `clase_id`, `estudiante_id`, `fecha`, `nivel` (alta/media/baja), `user_id`
- **ModoClase.tsx**: Agregar `saveParticipacionFn` con debounce, cargar datos existentes al entrar

#### 2. Corregir stale closure en ModoClase
- Aplicar el mismo patrón `useRef` a `saveAsistenciaFn`, `saveNotasFn`, `saveDiarioFn` y `saveObservacionesFn` en ModoClase.tsx

#### 3. Agregar tab "Resumen" y reorganizar tabs
- Reemplazar los 6 tabs actuales por: **Resumen | Asist. | Notas | Obs. | Diario**
- Mover "Participación" dentro del tab de Asistencia (como botón secundario por estudiante)
- Mover "Programa" a un botón/ícono en el header (es configuración, no uso diario)
- **Tab Resumen**: Tarjeta con stats del día:
  - Asistencia: X presentes, Y faltas, Z tardes
  - Notas cargadas hoy (si hay evaluación activa)
  - Observaciones registradas
  - Tema del diario (con link rápido al tab)
  - Tema planificado para hoy + estado (completado/parcial/suspendido)

#### 4. Auto-completar diario desde planificación
- Al cargar ModoClase, buscar en `planificacion_clases` el tema de hoy
- Si existe y el diario está vacío, pre-llenar "Tema trabajado" con el tema planificado
- Mostrar badge "Tema planificado" junto al campo

#### 5. Enriquecer StudentDetailSheet
- Agregar pestaña "Asistencia" con historial (últimas 20 clases, % presencia)
- Agregar pestaña "Notas" con promedio y lista de calificaciones
- Mostrar badge de participación promedio

---

### Archivos a modificar/crear

| Archivo | Cambio |
|---|---|
| **Migration SQL** | Crear tabla `participacion_clase` con RLS |
| `src/pages/ModoClase.tsx` | Reorganizar tabs, agregar Resumen, fix refs, persistir participación, auto-fill diario |
| `src/components/clase/StudentDetailSheet.tsx` | Agregar historial de asistencia y notas |
| `src/integrations/supabase/types.ts` | Se actualiza automáticamente |

### Orden de implementación
1. Migration (tabla participacion_clase)
2. ModoClase: fix stale closures + persistir participación
3. ModoClase: reorganizar tabs + tab Resumen + auto-fill diario
4. StudentDetailSheet: enriquecer con historial

