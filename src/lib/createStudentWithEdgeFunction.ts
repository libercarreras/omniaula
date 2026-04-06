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
