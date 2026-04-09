import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";

interface Profile {
  id: string;
  user_id: string;
  nombre: string;
  email: string | null;
  plan: string;
  avatar_url: string | null;
}

interface PlanLimits {
  plan: string;
  max_grupos: number;
  max_estudiantes_por_grupo: number;
  informes_avanzados: boolean;
  analisis_completo: boolean;
  exportacion: boolean;
  comentarios_ia: boolean;
}

type AppRole = "admin" | "docente";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  planLimits: PlanLimits | null;
  role: AppRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

let planLimitsCache: PlanLimits[] | null = null;

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  planLimits: null,
  role: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [planLimits, setPlanLimits] = useState<PlanLimits | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const clearState = () => {
    setUser(null);
    setSession(null);
    setProfile(null);
    setPlanLimits(null);
    setRole(null);
  };

  const fetchProfile = async (userId: string) => {
    try {
      const limitsPromise = planLimitsCache
        ? Promise.resolve({ data: planLimitsCache, error: null })
        : supabase.from("plan_limits").select("*");

      const [profileRes, roleRes, allLimitsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
        limitsPromise,
      ]);

      if (!profileRes.data) {
        console.error("[OmniAula][useAuth] Profile not found for user:", userId);
        toast.error("La cuenta no terminó de configurarse. Intentá de nuevo.");
        await signOut();
        return;
      }

      const p = profileRes.data as Profile;
      setProfile(p);

      if (allLimitsRes.data && !planLimitsCache) {
        planLimitsCache = allLimitsRes.data as PlanLimits[];
      }
      const limits = (planLimitsCache || []).find((l) => l.plan === p.plan) ?? null;
      if (limits) setPlanLimits(limits as PlanLimits);

      if (roleRes.data && roleRes.data.length > 0) {
        const roles = roleRes.data.map((r) => r.role);
        setRole(roles.includes("admin") ? "admin" : "docente");
      } else {
        setRole("docente");
      }
    } catch (err) {
      console.error("[OmniAula][useAuth] fetchProfile error:", err);
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    await fetchProfile(user.id);
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[OmniAula][useAuth] signOut error (ignored):", err);
    }
    clearState();
    localStorage.removeItem("institucion_activa_id");
  };

  // Layer 1: Auth state — immediate, no async work
  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, sess) => {
        if (!mounted) return;
        if (event === "SIGNED_OUT") {
          clearState();
          setLoading(false);
          return;
        }
        setSession(sess);
        setUser(sess?.user ?? null);
        setLoading(false);
      }
    );

    // Bootstrap: restore session from storage
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      if (!mounted) return;
      setSession(sess);
      setUser(sess?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Layer 2: Profile — runs whenever user changes
  useEffect(() => {
    if (!user) {
      setProfile(null);
      setPlanLimits(null);
      setRole(null);
      return;
    }
    fetchProfile(user.id);
  }, [user?.id]);

  return (
    <AuthContext.Provider value={{ user, session, profile, planLimits, role, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
