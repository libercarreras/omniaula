import React from "react";
import { render, screen, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { createBuilder, safeBuilder } from "../helpers/supabaseMock";
import { supabase } from "@/integrations/supabase/client";

// Capture the onAuthStateChange callback so tests can fire it manually.
// The variable is assigned when AuthProvider mounts and calls onAuthStateChange.
let capturedCallback: ((event: string, session: any) => Promise<void>) | null = null;

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      onAuthStateChange: vi.fn((cb: any) => {
        capturedCallback = cb;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}));

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

async function fireSignIn(session = MOCK_SESSION) {
  await act(async () => { await capturedCallback!("SIGNED_IN", session); });
}

describe("useAuth", () => {
  beforeEach(() => {
    capturedCallback = null;
    fromMock.mockReset();
    fromMock.mockReturnValue(safeBuilder());
    vi.mocked(supabase.auth.signOut).mockResolvedValue({ error: null } as any);
  });

  it("starts with loading=true before the auth callback fires", () => {
    renderAuth();
    expect(screen.getByTestId("loading").textContent).toBe("true");
    expect(screen.getByTestId("userId").textContent).toBe("none");
  });

  it("SIGNED_IN: loads profile, role, and plan limits from Supabase", async () => {
    // fetchProfile parallel calls: profiles, user_roles, plan_limits (in that order)
    fromMock
      .mockReturnValueOnce(createBuilder({ data: PROFILE_ROW, error: null }))      // profiles.single()
      .mockReturnValueOnce(createBuilder({ data: [{ role: "docente" }], error: null })) // user_roles
      .mockReturnValueOnce(createBuilder({ data: [PLAN_LIMITS_ROW], error: null })); // plan_limits

    renderAuth();
    await fireSignIn();

    expect(screen.getByTestId("loading").textContent).toBe("false");
    expect(screen.getByTestId("userId").textContent).toBe("user-1");
    expect(screen.getByTestId("role").textContent).toBe("docente");
    expect(screen.getByTestId("plan").textContent).toBe("free");
    // plan_limits row for "free" plan should be applied
    expect(screen.getByTestId("maxGrupos").textContent).toBe("5");
  });

  it("admin role takes priority when user has both admin and docente entries", async () => {
    // planLimitsCache is populated from the previous test — plan_limits not fetched again.
    // fetchProfile parallel calls: profiles, user_roles (2 calls, not 3)
    fromMock
      .mockReturnValueOnce(createBuilder({ data: PROFILE_ROW, error: null }))
      .mockReturnValueOnce(createBuilder({ data: [{ role: "docente" }, { role: "admin" }], error: null }));

    renderAuth();
    await fireSignIn();

    expect(screen.getByTestId("role").textContent).toBe("admin");
  });

  it("defaults to docente when user has no role entries", async () => {
    fromMock
      .mockReturnValueOnce(createBuilder({ data: PROFILE_ROW, error: null }))
      .mockReturnValueOnce(createBuilder({ data: [], error: null })); // empty user_roles

    renderAuth();
    await fireSignIn();

    expect(screen.getByTestId("role").textContent).toBe("docente");
  });

  it("SIGNED_OUT: clears user, role, and profile from state", async () => {
    fromMock
      .mockReturnValueOnce(createBuilder({ data: PROFILE_ROW, error: null }))
      .mockReturnValueOnce(createBuilder({ data: [{ role: "docente" }], error: null }));

    renderAuth();
    await fireSignIn();
    expect(screen.getByTestId("userId").textContent).toBe("user-1");

    // Fire sign-out event via the callback (the real client does this after signOut)
    await act(async () => { await capturedCallback!("SIGNED_OUT", null); });

    expect(screen.getByTestId("userId").textContent).toBe("none");
    expect(screen.getByTestId("role").textContent).toBe("none");
    expect(screen.getByTestId("plan").textContent).toBe("none");
  });

  it("TOKEN_REFRESHED: sets loading=false without re-fetching profile", async () => {
    // No from() mocks needed — TOKEN_REFRESHED early-returns before fetchProfile
    renderAuth();
    await act(async () => { await capturedCallback!("TOKEN_REFRESHED", MOCK_SESSION); });

    expect(screen.getByTestId("loading").textContent).toBe("false");
    // Profile was never fetched
    expect(fromMock).not.toHaveBeenCalled();
  });
});
