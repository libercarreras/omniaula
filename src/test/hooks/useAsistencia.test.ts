import { act, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { useAsistencia } from "@/hooks/clase/useAsistencia";
import { createBuilder, safeBuilder } from "../helpers/supabaseMock";
import { renderHookWithQuery } from "../helpers/renderWithProviders";
import { supabase } from "@/integrations/supabase/client";
import type { Estudiante } from "@/types/domain";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: vi.fn() },
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

const fromMock = vi.mocked(supabase.from);
const student = { id: "est-1", nombre_completo: "Ana García", grupo_id: "grp-1" } as Estudiante;
const DATE = "2026-04-05";

function hookArgs(overrides: Partial<Parameters<typeof useAsistencia>> = []) {
  const defaults: Parameters<typeof useAsistencia> = ["clase-1", "user-1", [student], DATE, false];
  return overrides.length > 0 ? (overrides as Parameters<typeof useAsistencia>) : defaults;
}

// ─── Real-timer tests (data loading) ──────────────────────────────────────────

describe("useAsistencia — data loading", () => {
  beforeEach(() => {
    fromMock.mockReset();
    fromMock.mockReturnValue(safeBuilder());
  });

  it("auto-initialises all students as presente when no records exist", async () => {
    const insertBuilder = createBuilder({ error: null });
    fromMock
      .mockReturnValueOnce(createBuilder({ data: [], error: null })) // initial query
      .mockReturnValueOnce(insertBuilder);                            // auto-insert

    const { result } = renderHookWithQuery(() => useAsistencia(...hookArgs()));

    await waitFor(() => expect(result.current.asistencia["est-1"]).toBe("presente"));

    // The auto-insert should have been called with the correct record
    expect(insertBuilder.insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ estudiante_id: "est-1", estado: "presente" }),
      ]),
    );
  });

  it("loads existing attendance records into local state", async () => {
    fromMock.mockReturnValueOnce(
      createBuilder({ data: [{ estudiante_id: "est-1", estado: "falta", motivo: null }], error: null }),
    );

    const { result } = renderHookWithQuery(() => useAsistencia(...hookArgs()));

    await waitFor(() => expect(result.current.asistencia["est-1"]).toBe("falta"));
  });

  it("computes stats correctly from loaded data", async () => {
    const two = { id: "est-2", nombre_completo: "Carlos López", grupo_id: "grp-1" } as Estudiante;
    fromMock.mockReturnValueOnce(
      createBuilder({
        data: [
          { estudiante_id: "est-1", estado: "presente", motivo: null },
          { estudiante_id: "est-2", estado: "falta",    motivo: null },
        ],
        error: null,
      }),
    );

    const { result } = renderHookWithQuery(() =>
      useAsistencia("clase-1", "user-1", [student, two], DATE, false),
    );

    await waitFor(() => expect(result.current.stats.presentes).toBe(1));
    expect(result.current.stats.total).toBe(2);
    expect(result.current.stats.faltas).toBe(1);
  });

  it("does NOT auto-insert when isReadonly is true even if records are empty", async () => {
    const insertBuilder = createBuilder({ error: null });
    fromMock
      .mockReturnValueOnce(createBuilder({ data: [], error: null }))
      .mockReturnValueOnce(insertBuilder);

    // isReadonly = true
    const { result } = renderHookWithQuery(() =>
      useAsistencia("clase-1", "user-1", [student], DATE, true),
    );

    // State stays empty because the auto-insert branch is skipped
    await waitFor(() => expect(result.current.asistencia).toEqual({}));
    expect(insertBuilder.insert).not.toHaveBeenCalled();
  });
});

// ─── Fake-timer tests (state mutations + debounced save) ──────────────────────

describe("useAsistencia — interactions and save", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    fromMock.mockReset();
    fromMock.mockReturnValue(safeBuilder());
  });

  afterEach(() => { vi.useRealTimers(); });

  /** Flush microtasks so React Query can resolve + useEffect can run. */
  async function flushAll() {
    await act(async () => { await Promise.resolve(); });
    await act(async () => { await Promise.resolve(); });
    await act(async () => { await Promise.resolve(); });
  }

  it("marcarAsistencia toggles state immediately (before debounce fires)", async () => {
    fromMock.mockReturnValueOnce(
      createBuilder({ data: [{ estudiante_id: "est-1", estado: "presente", motivo: null }], error: null }),
    );

    const { result } = renderHookWithQuery(() => useAsistencia(...hookArgs()));
    await flushAll();

    expect(result.current.asistencia["est-1"]).toBe("presente");

    act(() => { result.current.marcarAsistencia("est-1", "falta"); });

    // State is updated immediately (React setState)
    expect(result.current.asistencia["est-1"]).toBe("falta");
    // debounce has not fired yet — save is still pending
    expect(result.current.saveStatus).toBe("pending");
  });

  it("marcarAsistencia with same estado toggles to null (deselect)", async () => {
    fromMock.mockReturnValueOnce(
      createBuilder({ data: [{ estudiante_id: "est-1", estado: "presente", motivo: null }], error: null }),
    );

    const { result } = renderHookWithQuery(() => useAsistencia(...hookArgs()));
    await flushAll();

    // Click "presente" when already presente → deselects
    act(() => { result.current.marcarAsistencia("est-1", "presente"); });
    expect(result.current.asistencia["est-1"]).toBeNull();
  });

  it("save: delete-then-insert called after 2000ms debounce", async () => {
    const deleteBuilder = createBuilder({ error: null });
    const insertBuilder = createBuilder({ error: null });
    fromMock
      .mockReturnValueOnce(createBuilder({ data: [{ estudiante_id: "est-1", estado: "presente", motivo: null }], error: null })) // query
      .mockReturnValueOnce(deleteBuilder) // saveFn: delete
      .mockReturnValueOnce(insertBuilder); // saveFn: insert

    const { result } = renderHookWithQuery(() => useAsistencia(...hookArgs()));
    await flushAll();

    act(() => { result.current.marcarAsistencia("est-1", "falta"); });

    await act(async () => { await vi.advanceTimersByTimeAsync(2000); });

    expect(deleteBuilder.delete).toHaveBeenCalled();
    expect(insertBuilder.insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ estudiante_id: "est-1", estado: "falta" }),
      ]),
    );
  });

  it("marcarTodosPresentes sets all students to presente and triggers save", async () => {
    const two = { id: "est-2", nombre_completo: "Carlos", grupo_id: "grp-1" } as Estudiante;
    fromMock.mockReturnValueOnce(
      createBuilder({
        data: [
          { estudiante_id: "est-1", estado: "falta",    motivo: null },
          { estudiante_id: "est-2", estado: "presente", motivo: null },
        ],
        error: null,
      }),
    );

    const { result } = renderHookWithQuery(() =>
      useAsistencia("clase-1", "user-1", [student, two], DATE, false),
    );
    await flushAll();

    act(() => { result.current.marcarTodosPresentes(); });

    expect(result.current.asistencia["est-1"]).toBe("presente");
    expect(result.current.asistencia["est-2"]).toBe("presente");
    expect(result.current.saveStatus).toBe("pending");
  });
});
