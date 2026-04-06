import React from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { InstitucionProvider, useInstitucion } from "@/hooks/useInstitucion";
import { createBuilder, safeBuilder } from "../helpers/supabaseMock";
import { supabase } from "@/integrations/supabase/client";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: vi.fn() },
}));

// Mock useAuth — useInstitucion only needs { user }
vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(() => ({ user: { id: "user-1" } })),
}));

import { useAuth } from "@/hooks/useAuth";

const fromMock = vi.mocked(supabase.from);
const useAuthMock = vi.mocked(useAuth);

const INST_ROW = {
  institucion_id: "inst-1",
  rol: "docente",
  instituciones: { id: "inst-1", nombre: "Escuela San Martín", direccion: "Av. San Martín 100", ciudad: "Buenos Aires", user_id: "user-1" },
};

const INST_ROW_2 = {
  institucion_id: "inst-2",
  rol: "admin",
  instituciones: { id: "inst-2", nombre: "Colegio Nacional", direccion: null, ciudad: "Córdoba", user_id: "user-1" },
};

function Consumer() {
  const { instituciones, institucionActiva, loading, setInstitucionActiva } = useInstitucion();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="count">{instituciones.length}</span>
      <span data-testid="activa">{institucionActiva?.id ?? "none"}</span>
      <span data-testid="nombre">{institucionActiva?.nombre ?? "none"}</span>
      <button
        data-testid="switch"
        onClick={() => setInstitucionActiva(instituciones[1])}
      >
        switch
      </button>
    </div>
  );
}

function renderInstitucion() {
  render(<InstitucionProvider><Consumer /></InstitucionProvider>);
}

describe("useInstitucion", () => {
  beforeEach(() => {
    fromMock.mockReset();
    fromMock.mockReturnValue(safeBuilder());
    localStorage.clear();
    useAuthMock.mockReturnValue({ user: { id: "user-1" } } as any);
  });

  it("fetches institutions and defaults to the first one", async () => {
    fromMock.mockReturnValueOnce(
      createBuilder({ data: [INST_ROW], error: null }),
    );

    renderInstitucion();

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    expect(screen.getByTestId("count").textContent).toBe("1");
    expect(screen.getByTestId("activa").textContent).toBe("inst-1");
    expect(screen.getByTestId("nombre").textContent).toBe("Escuela San Martín");
  });

  it("restores the active institution from localStorage on mount", async () => {
    localStorage.setItem("institucion_activa_id", "inst-2");

    fromMock.mockReturnValueOnce(
      createBuilder({ data: [INST_ROW, INST_ROW_2], error: null }),
    );

    renderInstitucion();

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    // inst-2 was saved → should be pre-selected
    expect(screen.getByTestId("activa").textContent).toBe("inst-2");
  });

  it("falls back to first institution when saved localStorage id is not found", async () => {
    localStorage.setItem("institucion_activa_id", "inst-999"); // stale id

    fromMock.mockReturnValueOnce(
      createBuilder({ data: [INST_ROW], error: null }),
    );

    renderInstitucion();

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    // Stale id not found → defaults to first
    expect(screen.getByTestId("activa").textContent).toBe("inst-1");
  });

  it("setInstitucionActiva updates the active institution and persists to localStorage", async () => {
    fromMock.mockReturnValueOnce(
      createBuilder({ data: [INST_ROW, INST_ROW_2], error: null }),
    );

    renderInstitucion();
    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));

    act(() => { screen.getByTestId("switch").click(); });

    expect(screen.getByTestId("activa").textContent).toBe("inst-2");
    expect(localStorage.getItem("institucion_activa_id")).toBe("inst-2");
  });

  it("does not fetch when user is null", async () => {
    useAuthMock.mockReturnValue({ user: null } as any);

    renderInstitucion();

    await waitFor(() => expect(screen.getByTestId("loading").textContent).toBe("false"));
    expect(screen.getByTestId("count").textContent).toBe("0");
    expect(fromMock).not.toHaveBeenCalled();
  });
});
