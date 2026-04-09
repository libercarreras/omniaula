
Diagnóstico

Do I know what the issue is? Sí.

El problema real no parece ser el warning de refs ni el PWA. Lo que veo es una combinación de dos fallas:

1. La app acepta la sesión autenticada solo con `user`, aunque falten los datos mínimos del docente.
- `ProtectedRoute` deja entrar si existe `user`.
- `useAuth` intenta cargar `profiles`, `user_roles` y límites.
- Si `profiles` no existe, hoy falla con `.single()` y el estado queda con `user` válido pero `profile = null`.
- Ese estado explica exactamente que aparezca `??` / “Docente”.

2. En el backend faltan piezas de bootstrap de usuario.
- Existen las funciones `handle_new_user`, `handle_new_user_role` y `handle_new_user_institucion`.
- Pero el estado actual reportado del backend indica que no hay triggers activos.
- Si esos triggers no están creados en la base real, los docentes creados por administración pueden iniciar sesión, pero no reciben:
  - perfil
  - rol
  - institución/membresía
- Eso deja la app en un estado inconsistente: entra, pero no queda “usable”.

Además hay una tercera fragilidad:
3. `useInstitucion` no está endurecido.
- Hace el join de `profesor_institucion` con `instituciones` y luego accede a `row.instituciones.id` sin validar `null`.
- Si hay membresías huérfanas o datos incompletos, puede romper el render.

Plan de arreglo

1. Reparar el bootstrap de cuentas en Lovable Cloud
- Crear una migración para asegurar los triggers faltantes:
  - creación automática de `profiles`
  - creación automática de `user_roles`
  - creación automática de institución + membresía inicial
- Hacer la migración idempotente para no duplicar triggers si ya existen.

2. Backfill de usuarios ya afectados
- En la misma migración, completar datos faltantes para cuentas existentes:
  - crear `profiles` faltantes
  - crear rol `docente` faltante en `user_roles`
  - crear institución y fila en `profesor_institucion` si faltan
- Esto corrige tanto el “docente fantasma” como cualquier cuenta creada antes de que el bootstrap estuviera bien.

3. Endurecer `src/hooks/useAuth.tsx`
- Cambiar la lectura de perfil de `.single()` a `.maybeSingle()`.
- Si existe sesión pero no existe perfil, tratarla como sesión inválida/incompleta:
  - limpiar estado local
  - cerrar sesión localmente
  - redirigir a `/login`
  - mostrar un toast claro tipo “La cuenta no terminó de configurarse”.
- Reordenar el bootstrap para hacer `getSession()` antes del listener de cambios.
- Asegurar que `loading` siempre se resuelve.

4. Endurecer `src/hooks/useInstitucion.tsx`
- Envolver `fetchInstituciones()` en `try/catch`.
- No asumir que `row.instituciones` siempre existe.
- Filtrar filas inválidas en vez de romper.
- Si no hay institución válida, terminar `loading` y devolver estado vacío, no dejar la app colgada.

5. Hacer el cierre de sesión realmente forzado
- En `useAuth`, usar cierre de sesión local resistente a sesiones corruptas.
- En `AppLayout`, no depender de que una llamada remota termine bien para navegar a `/login`.
- Limpiar también el `institucion_activa_id` guardado localmente para evitar arrastres.

Archivos a tocar

- `src/hooks/useAuth.tsx`
- `src/hooks/useInstitucion.tsx`
- `src/components/layout/AppLayout.tsx`
- `supabase/migrations/...sql`

Detalle técnico

```text
Estado roto actual:
sesión auth válida
-> falta profile / role / institución
-> ProtectedRoute deja entrar igual
-> header muestra ?? 
-> contexto de institución queda vacío o inconsistente
-> logout puede no resolver bien

Estado buscado:
sesión auth válida
-> backend garantiza profile + role + institución
-> frontend valida datos mínimos
-> si faltan, expulsa limpiamente a login
-> nunca vuelve a quedar un docente “fantasma”
```

Resultado esperado

- Desaparece el usuario “??”.
- Las cuentas existentes quedan reparadas.
- Las cuentas nuevas se crean completas automáticamente.
- Si vuelve a existir una sesión corrupta, la app la corta sola y vuelve al login en lugar de quedarse rota.
