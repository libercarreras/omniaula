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

  const fetchProfile = async (userId: string): Promise<boolean> => {
    const limitsPromise = planLimitsCache
      ? Promise.resolve({ data: planLimitsCache, error: null })
      : supabase.from("plan_limits").select("*");

    const [profileRes, roleRes, allLimitsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
      limitsPromise,
    ]);

    if (!profileRes.data) {
      // Profile missing — session is incomplete
      console.error("[OmniAula][useAuth] Profile not found for user:", userId);
      return false;
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

    return true;
  };

  const refreshProfile = async () => {
    if (!user) return;
    try {
      await fetchProfile(user.id);
    } catch (err) {
      console.error("[OmniAula][useAuth] refreshProfile falló:", err);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[OmniAula][useAuth] signOut error (ignored):", err);
    }
    // Always clear local state
    clearState();
    localStorage.removeItem("institucion_activa_id");
  };

  useEffect(() => {
    let mounted = true;
    let bootstrapDone = false;

    // Safety-net timeout
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn("[OmniAula][useAuth] Auth timeout — forcing loading=false");
        setLoading(false);
      }
    }, 8000);

    // 1. Listener for ongoing auth events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, sess) => {
        if (!mounted) return;
        if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
          setSession(sess);
          setUser(sess?.user ?? null);
          return;
        }
        if (event === "SIGNED_OUT") {
          clearState();
          setLoading(false);
          return;
        }
        // Skip INITIAL_SESSION if bootstrap already handled it
        if (event === "INITIAL_SESSION" && bootstrapDone) return;

        setSession(sess);
        setUser(sess?.user ?? null);
        if (sess?.user) {
          try {
            const ok = await fetchProfile(sess.user.id);
            if (!ok && mounted) {
              toast.error("La cuenta no terminó de configurarse. Intentá de nuevo.");
              await signOut();
            }
          } catch (err) {
            console.error("[OmniAula][useAuth] fetchProfile falló:", err);
            // Don't clearState on transient errors — keep existing profile
          }
        }
      }
    );

    // 2. Bootstrap: restore session from storage
    supabase.auth.getSession().then(async ({ data: { session: sess } }) => {
      if (!mounted) return;
      bootstrapDone = true;
      setSession(sess);
      setUser(sess?.user ?? null);
      try {
        if (sess?.user) {
          const ok = await fetchProfile(sess.user.id);
          if (!ok && mounted) {
            console.warn("[OmniAula][useAuth] No profile found on bootstrap — signing out");
            toast.error("La cuenta no terminó de configurarse. Intentá de nuevo.");
            await signOut();
          }
        }
      } catch (err) {
        console.error("[OmniAula][useAuth] bootstrap fetchProfile falló:", err);
      } finally {
        if (mounted) {
          clearTimeout(timeout);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, profile, planLimits, role, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
