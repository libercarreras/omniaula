import { act, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useClaseData } from "@/hooks/clase/useClaseData";
import { createBuilder, safeBuilder } from "../helpers/supabaseMock";
import { renderHookWithQuery } from "../helpers/renderWithProviders";
import { supabase } from "@/integrations/supabase/client";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: vi.fn() },
}));

const fromMock = vi.mocked(supabase.from);

// fetchClaseData call order:
// 1. clases (maybeSingle)
// Then parallel: 2. materias  3. grupos  4. estudiantes  5. evaluaciones
const claseFixture: any = { id: "clase-1", materia_id: "mat-1", grupo_id: "grp-1", user_id: "user-1", fecha: "2026-04-05" };
const materiaFixture: any = { id: "mat-1", nombre: "Matemáticas" };
const grupoFixture: any = { id: "grp-1", nombre: "1A" };
const estudianteFixture: any = { id: "est-1", nombre_completo: "Ana García", grupo_id: "grp-1" };

function setupFullFetch() {
  fromMock
    .mockReturnValueOnce(createBuilder({ data: claseFixture, error: null }))        // clases
    .mockReturnValueOnce(createBuilder({ data: materiaFixture, error: null }))      // materias
    .mockReturnValueOnce(createBuilder({ data: grupoFixture, error: null }))        // grupos
    .mockReturnValueOnce(createBuilder({ data: [estudianteFixture], error: null })) // estudiantes
    .mockReturnValueOnce(createBuilder({ data: [], error: null }));                 // evaluaciones
}

describe("useClaseData", () => {
  beforeEach(() => {
    fromMock.mockReset();
    fromMock.mockReturnValue(safeBuilder());
  });

  it("fetches and exposes clase, materia, grupo, estudiantes", async () => {
    setupFullFetch();

    const { result } = renderHookWithQuery(() => useClaseData("clase-1", "user-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.clase?.id).toBe("clase-1");
    expect(result.current.materia?.id).toBe("mat-1");
    expect(result.current.grupo?.id).toBe("grp-1");
    expect(result.current.estudiantes).toHaveLength(1);
    expect(result.current.estudiantes[0].id).toBe("est-1");
  });

  it("stays in pending/loading state and never fetches when claseId is undefined", () => {
    const { result } = renderHookWithQuery(() => useClaseData(undefined, "user-1"));

    expect(result.current.loading).toBe(true);
    expect(result.current.clase).toBeNull();
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("stays in pending/loading state and never fetches when userId is undefined", () => {
    const { result } = renderHookWithQuery(() => useClaseData("clase-1", undefined));

    expect(result.current.loading).toBe(true);
    expect(result.current.clase).toBeNull();
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("updateClase applies an optimistic patch to cached data without refetching", async () => {
    setupFullFetch();

    const { result } = renderHookWithQuery(() => useClaseData("clase-1", "user-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const callCountBeforeUpdate = fromMock.mock.calls.length;

    act(() => { result.current.updateClase({ fecha: "2026-04-06" }); });

    expect(result.current.clase?.fecha).toBe("2026-04-06");
    // No additional Supabase calls — purely a cache mutation
    expect(fromMock.mock.calls.length).toBe(callCountBeforeUpdate);
  });

  it("returns null clase when Supabase returns null (clase not found)", async () => {
    fromMock.mockReturnValueOnce(createBuilder({ data: null, error: null })); // maybeSingle → null

    const { result } = renderHookWithQuery(() => useClaseData("clase-1", "user-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.clase).toBeNull();
    // Dependent queries (materia, grupo, etc.) should not have been called
    expect(fromMock).toHaveBeenCalledTimes(1);
  });
});
