import { useState, useEffect, createContext, useContext, ReactNode, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

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
  const bootstrapDone = useRef(false);

  const fetchProfile = async (userId: string) => {
    try {
      const limitsPromise = planLimitsCache
        ? Promise.resolve({ data: planLimitsCache, error: null })
        : supabase.from("plan_limits").select("*");

      const [profileRes, roleRes, allLimitsRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).single(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
        limitsPromise,
      ]);

      if (profileRes.data) {
        const p = profileRes.data as Profile;
        setProfile(p);
        if (allLimitsRes.data && !planLimitsCache) {
          planLimitsCache = allLimitsRes.data as PlanLimits[];
        }
        const limits = (planLimitsCache || []).find((l) => l.plan === p.plan) ?? null;
        if (limits) setPlanLimits(limits as PlanLimits);
      }

      if (roleRes.data && roleRes.data.length > 0) {
        const roles = roleRes.data.map((r) => r.role);
        setRole(roles.includes("admin") ? "admin" : "docente");
      } else {
        setRole("docente");
      }
    } catch (err) {
      console.error("[OmniAula][useAuth] fetchProfile error:", err);
      setProfile(null);
      setPlanLimits(null);
      setRole("docente");
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      await fetchProfile(user.id);
    } catch (err) {
      console.error("[OmniAula][useAuth] refreshProfile falló:", err);
    }
  };

  useEffect(() => {
    // 1. Bootstrap: restore session from storage
    supabase.auth.getSession().then(async ({ data: { session: restored } }) => {
      if (bootstrapDone.current) return;
      bootstrapDone.current = true;

      setSession(restored);
      setUser(restored?.user ?? null);

      if (restored?.user) {
        await fetchProfile(restored.user.id);
      }
      setLoading(false);
    }).catch(() => {
      if (!bootstrapDone.current) {
        bootstrapDone.current = true;
        setLoading(false);
      }
    });

    // 2. Listen for subsequent auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        // If bootstrap already resolved this initial event, skip the first INITIAL_SESSION
        if (!bootstrapDone.current) {
          // getSession hasn't resolved yet; let it handle bootstrap
          return;
        }

        if (event === "TOKEN_REFRESHED") return;

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          await fetchProfile(newSession.user.id);
        } else {
          setProfile(null);
          setPlanLimits(null);
          setRole(null);
        }
        setLoading(false);
      }
    );

    // 3. Safety timeout
    const timeout = setTimeout(() => {
      if (!bootstrapDone.current) {
        console.warn("[OmniAula][useAuth] Auth timeout — forcing loading=false");
        bootstrapDone.current = true;
        setLoading(false);
      }
    }, 8000);

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setPlanLimits(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, planLimits, role, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
