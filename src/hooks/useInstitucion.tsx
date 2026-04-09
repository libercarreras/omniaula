import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Institucion {
  id: string;
  nombre: string;
  direccion: string | null;
  ciudad: string | null;
  user_id: string;
  rol: string;
}

interface InstitucionContextType {
  instituciones: Institucion[];
  institucionActiva: Institucion | null;
  setInstitucionActiva: (inst: Institucion) => void;
  loading: boolean;
  refresh: () => Promise<void>;
}

const InstitucionContext = createContext<InstitucionContextType>({
  instituciones: [],
  institucionActiva: null,
  setInstitucionActiva: () => {},
  loading: true,
  refresh: async () => {},
});

const STORAGE_KEY = "institucion_activa_id";

export function InstitucionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [institucionActiva, setInstitucionActivaState] = useState<Institucion | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInstituciones = async () => {
    if (!user) {
      setInstituciones([]);
      setInstitucionActivaState(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("profesor_institucion")
      .select("institucion_id, rol, instituciones(id, nombre, direccion, ciudad, user_id)")
      .eq("user_id", user.id);

    type ProfesorInstitucionRow = {
      institucion_id: string;
      rol: string;
      instituciones: { id: string; nombre: string; direccion: string | null; ciudad: string | null; user_id: string } | null;
    };
    const mapped: Institucion[] = (data || []).map((row: ProfesorInstitucionRow) => ({
      id: row.instituciones.id,
      nombre: row.instituciones.nombre,
      direccion: row.instituciones.direccion,
      ciudad: row.instituciones.ciudad,
      user_id: row.instituciones.user_id,
      rol: row.rol,
    }));

    setInstituciones(mapped);

    const savedId = localStorage.getItem(STORAGE_KEY);
    const saved = mapped.find(i => i.id === savedId);
    if (saved) {
      setInstitucionActivaState(saved);
    } else if (mapped.length > 0) {
      setInstitucionActivaState(mapped[0]);
      localStorage.setItem(STORAGE_KEY, mapped[0].id);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInstituciones();
  }, [user]);

  const setInstitucionActiva = (inst: Institucion) => {
    setInstitucionActivaState(inst);
    localStorage.setItem(STORAGE_KEY, inst.id);
  };

  return (
    <InstitucionContext.Provider value={{ instituciones, institucionActiva, setInstitucionActiva, loading, refresh: fetchInstituciones }}>
      {children}
    </InstitucionContext.Provider>
  );
}

export const useInstitucion = () => useContext(InstitucionContext);
