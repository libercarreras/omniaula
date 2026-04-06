import { act, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { useDiario } from "@/hooks/clase/useDiario";
import { createBuilder, safeBuilder } from "../helpers/supabaseMock";
import { renderHookWithQuery } from "../helpers/renderWithProviders";
import { supabase } from "@/integrations/supabase/client";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: vi.fn() },
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}));

const fromMock = vi.mocked(supabase.from);

// fetchDiario makes 2 parallel calls (both to "diario_clase"):
// 1. select("*") .eq(clase_id).eq(fecha).maybeSingle()     → the diary entry for today
// 2. select("tema_trabajado") .eq(clase_id).not().neq().order().limit(5)  → prev topics for autocomplete
function setupInitialFetch(diario: any | null, prevTopics: any[] = []) {
  fromMock
    .mockReturnValueOnce(createBuilder({ data: diario, error: null }))       // today's entry
    .mockReturnValueOnce(createBuilder({ data: prevTopics, error: null }));  // past topics
}

const DEFAULT_ARGS: Parameters<typeof useDiario> = [
  "clase-1",
  "user-1",
  "2026-04-05",
  false,           // isReadonly
  null,            // temaPlanificado
  vi.fn(),         // onPlanEstadoChange
];

// ─── Real-timer tests (data loading) ──────────────────────────────────────────

describe("useDiario — data loading", () => {
  beforeEach(() => {
    fromMock.mockReset();
    fromMock.mockReturnValue(safeBuilder());
  });

  it("loads an existing diary entry into local state", async () => {
    const existingEntry = {
      id: "diary-1",
      tema_trabajado: "Fracciones",
      actividad_realizada: "Ejercicios en grupo",
      observaciones: null,
    };
    setupInitialFetch(existingEntry);

    const { result } = renderHookWithQuery(() => useDiario(...DEFAULT_ARGS));

    await waitFor(() => expect(result.current.diarioTema).toBe("Fracciones"));
    expect(result.current.diarioActividad).toBe("Ejercicios en grupo");
    expect(result.current.diarioId).toBe("diary-1");
    expect(result.current.diarioObs).toBe("");
  });

  it("populates sugerencias from past diary topics", async () => {
    setupInitialFetch(
      { id: "diary-1", tema_trabajado: "Fracciones", actividad_realizada: null, observaciones: null },
      [{ tema_trabajado: "Suma" }, { tema_trabajado: "Resta" }],
    );

    const { result } = renderHookWithQuery(() => useDiario(...DEFAULT_ARGS));

    await waitFor(() => expect(result.current.diarioSugerencias).toHaveLength(2));
    expect(result.current.diarioSugerencias).toContain("Suma");
    expect(result.current.diarioSugerencias).toContain("Resta");
  });

  it("auto-creates a diary entry when none exists for the date", async () => {
    const insertBuilder = createBuilder({ data: { id: "new-diary-1" }, error: null });
    setupInitialFetch(null);
    // The auto-create insert:
    fromMock.mockReturnValueOnce(insertBuilder);

    const { result } = renderHookWithQuery(() => useDiario(...DEFAULT_ARGS));

    await waitFor(() => expect(result.current.diarioId).toBe("new-diary-1"));
    expect(insertBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ clase_id: "clase-1", user_id: "user-1", fecha: "2026-04-05" }),
    );
  });

  it("does NOT auto-create when isReadonly is true", async () => {
    const insertBuilder = createBuilder({ data: { id: "new-diary-1" }, error: null });
    setupInitialFetch(null);
    fromMock.mockReturnValueOnce(insertBuilder);

    const args: Parameters<typeof useDiario> = ["clase-1", "user-1", "2026-04-05", true, null, vi.fn()];
    const { result } = renderHookWithQuery(() => useDiario(...args));

    // diarioId stays null — no insert
    await waitFor(() => expect(result.current.diarioId).toBeNull());
    expect(insertBuilder.insert).not.toHaveBeenCalled();
  });
});

// ─── Fake-timer tests (handleDiarioChange + debounced save) ───────────────────

describe("useDiario — interactions and save", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    fromMock.mockReset();
    fromMock.mockReturnValue(safeBuilder());
  });

  afterEach(() => { vi.useRealTimers(); });

  async function flushAll() {
    await act(async () => { await Promise.resolve(); });
    await act(async () => { await Promise.resolve(); });
    await act(async () => { await Promise.resolve(); });
  }

  it("handleDiarioChange updates local state immediately (before debounce)", async () => {
    setupInitialFetch({ id: "diary-1", tema_trabajado: "", actividad_realizada: "", observaciones: null });

    const { result } = renderHookWithQuery(() => useDiario(...DEFAULT_ARGS));
    await flushAll();

    act(() => { result.current.handleDiarioChange("tema", "Números enteros"); });
    expect(result.current.diarioTema).toBe("Números enteros");
    expect(result.current.saveStatus).toBe("pending");

    act(() => { result.current.handleDiarioChange("actividad", "Ejercicios"); });
    expect(result.current.diarioActividad).toBe("Ejercicios");
  });

  it("save: updates the diary record after 3000ms debounce", async () => {
    const updateBuilder = createBuilder({ error: null });
    // plan lookup returns empty (no pending plan) — simpler path
    const planSelectBuilder = createBuilder({ data: [], error: null });

    setupInitialFetch({ id: "diary-1", tema_trabajado: "", actividad_realizada: "", observaciones: null });
    fromMock
      .mockReturnValueOnce(updateBuilder)     // diario_clase update
      .mockReturnValueOnce(planSelectBuilder); // planificacion_clases select

    const { result } = renderHookWithQuery(() => useDiario(...DEFAULT_ARGS));
    await flushAll();

    act(() => { result.current.handleDiarioChange("tema", "Números enteros"); });

    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });

    expect(updateBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({ tema_trabajado: "Números enteros" }),
    );
  });

  it("save: calls onPlanEstadoChange('completado') when pending plan exists", async () => {
    const onPlanEstadoChange = vi.fn();
    const args: Parameters<typeof useDiario> = [
      "clase-1", "user-1", "2026-04-05", false, null, onPlanEstadoChange,
    ];

    const updateBuilder = createBuilder({ error: null });
    const planSelectBuilder = createBuilder({
      data: [{ id: "plan-1", estado: "pendiente" }],
      error: null,
    });
    const planUpdateBuilder = createBuilder({ error: null });

    setupInitialFetch({ id: "diary-1", tema_trabajado: "", actividad_realizada: "", observaciones: null });
    fromMock
      .mockReturnValueOnce(updateBuilder)      // diario update
      .mockReturnValueOnce(planSelectBuilder)  // planificacion select
      .mockReturnValueOnce(planUpdateBuilder); // planificacion update

    const { result } = renderHookWithQuery(() => useDiario(...args));
    await flushAll();

    act(() => { result.current.handleDiarioChange("tema", "Fracciones"); });
    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });

    expect(onPlanEstadoChange).toHaveBeenCalledWith("completado");
    expect(planUpdateBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({ estado: "completado" }),
    );
  });

  it("save: does NOT update plan when tema is empty", async () => {
    const onPlanEstadoChange = vi.fn();
    const args: Parameters<typeof useDiario> = [
      "clase-1", "user-1", "2026-04-05", false, null, onPlanEstadoChange,
    ];

    const updateBuilder = createBuilder({ error: null });
    setupInitialFetch({ id: "diary-1", tema_trabajado: "Existing", actividad_realizada: "", observaciones: null });
    fromMock.mockReturnValueOnce(updateBuilder);

    const { result } = renderHookWithQuery(() => useDiario(...args));
    await flushAll();

    // Save with empty tema
    act(() => { result.current.handleDiarioChange("tema", ""); });
    await act(async () => { await vi.advanceTimersByTimeAsync(3000); });

    // Plan was NOT touched
    expect(onPlanEstadoChange).not.toHaveBeenCalled();
    expect(fromMock).not.toHaveBeenCalledWith("planificacion_clases");
  });
});
