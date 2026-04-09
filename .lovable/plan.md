

## Plan: Wire student creation through Edge Function (corrected)

### Problem
The previous plan used `supabase.functions.invoke()` which doesn't work correctly in the client. Must use `fetch()` with manual JWT Authorization header.

### Changes

**1. Create `src/lib/createStudentWithEdgeFunction.ts`**

```typescript
import { supabase } from "@/integrations/supabase/client";

interface CreateStudentParams {
  nombre_completo: string;
  grupo_id: string;
  numero_lista: number | null;
}

export async function createStudentWithEdgeFunction(params: CreateStudentParams) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error("No authenticated session");
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  
  const response = await fetch(
    `${supabaseUrl}/functions/v1/create-student`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Error al crear estudiante");
  }

  return data.student;
}
```

**2. Edit `src/pages/Estudiantes.tsx` (lines ~105-112)**

Replace the direct `supabase.from("estudiantes").insert(...)` else branch with:

```typescript
} else {
  const { createStudentWithEdgeFunction } = await import("@/lib/createStudentWithEdgeFunction");
  await createStudentWithEdgeFunction({
    nombre_completo: finalName,
    grupo_id: grupoId,
    numero_lista: numeroLista ? parseInt(numeroLista) : null,
  });
}
```

No other files affected. The Edge Function already handles JWT validation, name normalization, and duplicate checking server-side.

