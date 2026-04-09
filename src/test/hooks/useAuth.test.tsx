import React from "react";
import { render, screen, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";

// We need to reset the module-level planLimitsCache between tests
// so we use dynamic import after resetting modules
import { createBuilder, safeBuilder } from "../helpers/supabaseMock";

// Capture the onAuthStateChange callback so tests can fire it manually.
let capturedCallback: ((event: string, session: any) => Promise<void>) | null = null;

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      onAuthStateChange: vi.fn((cb: any) => {
        capturedCallback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

import { supabase } from "@/integrations/supabase/client";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

const fromMock = vi.mocked(supabase.from);

const MOCK_USER = { id: "user-1", email: "prof@school.edu" };
const MOCK_SESSION = { user: MOCK_USER };

const PROFILE_ROW = { id: "prof-1", user_id: "user-1", nombre: "Prof. García", email: "prof@school.edu", plan: "free", avatar_url: null };
const PLAN_LIMITS_ROW = { plan: "free", max_grupos: 5, max_estudiantes_por_grupo: 40, informes_avanzados: false, analisis_completo: false, exportacion: false, comentarios_ia: false };

// Consumer component that reads auth context
function Consumer() {
  const { user, loading, role, profile, planLimits, signOut } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="userId">{user?.id ?? "none"}</span>
      <span data-testid="role">{role ?? "none"}</span>
      <span data-testid="plan">{profile?.plan ?? "none"}</span>
      <span data-testid="maxGrupos">{String(planLimits?.max_grupos ?? "none")}</span>
      <button onClick={signOut}>sign out</button>
    </div>
  );
}

function renderAuth() {
  render(<AuthProvider><Consumer /></AuthProvider>);
}

function setupProfileMocks(opts?: { roles?: any[]; skipLimits?: boolean }) {
  const roles = opts?.roles ?? [{ role: "docente" }];
  // Order matters: limitsPromise is evaluated BEFORE Promise.all,
  // so plan_limits mock must come first, then profiles, then user_roles
  if (!opts?.skipLimits) {
    fromMock.mockReturnValueOnce(createBuilder({ data: [PLAN_LIMITS_ROW], error: null })); // plan_limits (1st from() call)
  }
  fromMock.mockReturnValueOnce(createBuilder({ data: PROFILE_ROW, error: null }));       // profiles (2nd)
  fromMock.mockReturnValueOnce(createBuilder({ data: roles, error: null }));              // user_roles (3rd)
}

async function fireSignIn(session = MOCK_SESSION) {
  await act(async () => { await capturedCallback!("SIGNED_IN", session); });
}

describe("useAuth", () => {
  beforeEach(() => {
    capturedCallback = null;
    fromMock.mockReset();
    fromMock.mockReturnValue(safeBuilder());
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null } as any);
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: null } } as any);
  });

  it("starts with loading=true before the auth callback fires", () => {
    renderAuth();
    expect(screen.getByTestId("loading").textContent).toBe("true");
    expect(screen.getByTestId("userId").textContent).toBe("none");
  });

  it("SIGNED_IN: loads profile, role, and plan limits from Supabase", async () => {
    setupProfileMocks();
    renderAuth();
    await fireSignIn();

    expect(screen.getByTestId("userId").textContent).toBe("user-1");
    expect(screen.getByTestId("role").textContent).toBe("docente");
    expect(screen.getByTestId("plan").textContent).toBe("free");
    expect(screen.getByTestId("maxGrupos").textContent).toBe("5");
  });

  it("admin role takes priority when user has both admin and docente entries", async () => {
    setupProfileMocks({ roles: [{ role: "docente" }, { role: "admin" }], skipLimits: true });
    renderAuth();
    await fireSignIn();

    expect(screen.getByTestId("role").textContent).toBe("admin");
  });

  it("defaults to docente when user has no role entries", async () => {
    setupProfileMocks({ roles: [] });
    renderAuth();
    await fireSignIn();

    expect(screen.getByTestId("role").textContent).toBe("docente");
  });

  it("SIGNED_OUT: clears user, role, and profile from state", async () => {
    setupProfileMocks();
    renderAuth();
    await fireSignIn();
    expect(screen.getByTestId("userId").textContent).toBe("user-1");

    await act(async () => { await capturedCallback!("SIGNED_OUT", null); });

    expect(screen.getByTestId("userId").textContent).toBe("none");
    expect(screen.getByTestId("role").textContent).toBe("none");
    expect(screen.getByTestId("plan").textContent).toBe("none");
  });

  it("TOKEN_REFRESHED: updates session without re-fetching profile", async () => {
    renderAuth();
    await act(async () => { await capturedCallback!("TOKEN_REFRESHED", MOCK_SESSION); });

    // Profile was never fetched — TOKEN_REFRESHED early-returns
    expect(fromMock).not.toHaveBeenCalled();
  });
});
