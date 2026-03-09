

## Plan: Reestructurar modelo de datos para multi-instituciones

Este es un cambio estructural importante que afecta la base de datos, la navegacion y la mayoria de las paginas.

---

### Fase 1: Migracion de base de datos

Una unica migracion SQL que:

1. **Crea tabla `instituciones`** (id uuid PK, nombre text NOT NULL, direccion text, ciudad text, user_id uuid NOT NULL, created_at, updated_at)
2. **Crea tabla `profesor_institucion`** (id uuid PK, user_id uuid NOT NULL, institucion_id uuid FK -> instituciones, rol text NOT NULL DEFAULT 'profesor', created_at)
3. **Agrega `institucion_id`** (uuid, nullable) a tabla `grupos`
4. **Agrega `apellido`** (text, nullable) a tabla `estudiantes`
5. **Migra datos existentes**: Para cada user_id distinto en `grupos`, crea una "Institucion Principal", inserta en `profesor_institucion` con rol='administrador', y actualiza `grupos.institucion_id`
6. **Hace `institucion_id` NOT NULL** en `grupos` despues de la migracion
7. **Crea funcion SECURITY DEFINER** `is_institucion_member(uuid, uuid)` que verifica pertenencia via `profesor_institucion`
8. **RLS para `instituciones`**: SELECT via `is_institucion_member`, INSERT para authenticated, UPDATE/DELETE solo administradores
9. **RLS para `profesor_institucion`**: CRUD donde `auth.uid() = user_id`
10. **Actualiza RLS de `grupos`**: Agrega politica para que miembros de la institucion puedan ver grupos de esa institucion

---

### Fase 2: Contexto de institucion activa

**Nuevo archivo `src/hooks/useInstitucion.tsx`**:
- Context con `institucionActiva`, `instituciones[]`, `setInstitucionActiva()`
- Al cargar, consulta `profesor_institucion` JOIN `instituciones` para el usuario
- Si tiene 1 sola institucion, auto-selecciona
- Persiste seleccion en `localStorage`
- Provee el context en `App.tsx` dentro de `AuthProvider`

---

### Fase 3: Nuevas paginas

**`src/pages/Instituciones.tsx`** - Lista "Mis Instituciones":
- Cards con nombre, direccion, ciudad, cantidad de grupos
- Boton "Nueva institucion" con dialog (nombre, direccion, ciudad)
- Al crear: inserta en `instituciones` y `profesor_institucion` con rol='administrador'
- Click en institucion -> la selecciona como activa y navega al Dashboard

---

### Fase 4: Modificaciones a paginas existentes

| Archivo | Cambio |
|---|---|
| `AppSidebar.tsx` | Agregar "Instituciones" (icono Building2) como primer item. Mostrar nombre de institucion activa |
| `MobileNav.tsx` | Agregar "Instituciones" en los tabs principales o en "Mas" |
| `App.tsx` | Agregar ruta `/instituciones`. Envolver con `InstitucionProvider` |
| `Dashboard.tsx` | Filtrar clases/grupos/estudiantes por `institucion_id` de la institucion activa. Mostrar nombre de institucion |
| `Grupos.tsx` | Filtrar por `institucion_id`. Al crear grupo, asignar `institucion_id` de la activa automaticamente |
| `Estudiantes.tsx` | Filtrar grupos del selector por `institucion_id` activa |
| `Materias.tsx` | Sin cambio (las materias son globales del profesor, no por institucion) |
| `Asistencia.tsx` | Filtrar clases por grupos de la institucion activa |
| `Evaluaciones.tsx` | Filtrar clases por grupos de la institucion activa |
| `DiarioClase.tsx` | Filtrar clases por grupos de la institucion activa |
| `Seguimiento.tsx` | Filtrar observaciones por estudiantes de la institucion activa |
| `Informes.tsx` | Filtrar clases por grupos de la institucion activa |
| `Analisis.tsx` | Filtrar clases por grupos de la institucion activa |

La logica de filtrado sera: obtener `grupos` donde `institucion_id = institucionActiva.id`, luego filtrar `clases` por esos `grupo_id`, y `estudiantes` por esos `grupo_id`.

---

### Fase 5: Selector de institucion

Agregar en el header/sidebar un selector rapido de institucion activa (dropdown) para cambiar entre instituciones sin ir a la pagina de Instituciones.

---

### Archivos nuevos
- `src/hooks/useInstitucion.tsx`
- `src/pages/Instituciones.tsx`

### Archivos modificados
- `src/App.tsx` (ruta + provider)
- `src/components/layout/AppSidebar.tsx` (item Instituciones + selector)
- `src/components/layout/MobileNav.tsx` (item Instituciones)
- `src/pages/Dashboard.tsx` (filtro por institucion)
- `src/pages/Grupos.tsx` (filtro + institucion_id en create)
- `src/pages/Estudiantes.tsx` (filtro grupos por institucion)
- `src/pages/Asistencia.tsx` (filtro clases)
- `src/pages/Evaluaciones.tsx` (filtro clases)
- `src/pages/DiarioClase.tsx` (filtro clases)
- `src/pages/Seguimiento.tsx` (filtro estudiantes)
- `src/pages/Informes.tsx` (filtro clases)
- `src/pages/Analisis.tsx` (filtro clases)

### Orden de implementacion
1. Migracion DB (tablas + RLS + datos)
2. Hook `useInstitucion` + Provider en App
3. Pagina Instituciones con CRUD
4. Sidebar + MobileNav + rutas
5. Actualizar todas las paginas para filtrar por institucion activa

