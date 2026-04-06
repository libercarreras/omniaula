import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useStudentMetrics, type StudentMetrics } from "@/hooks/useStudentMetrics";
import { createBuilder, safeBuilder } from "../helpers/supabaseMock";
import { supabase } from "@/integrations/supabase/client";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: vi.fn() },
}));

const fromMock = vi.mocked(supabase.from);

// Parallel fetch order in fetchMetrics:
// 1. asistencia  2. evaluaciones  3. observaciones  4. tareas  5. desempeno_diario
// Sequential (conditional):
// 6. notas (if evalIds.length > 0)
// 7. entregas (if tareaIds.length > 0)
function setupFetches({
  asistencia = [] as any[],
  evaluaciones = [] as any[],
  observaciones = [] as any[],
  tareas = [] as any[],
  desempeno = [] as any[],
  notas = [] as any[],
  entregas = [] as any[],
} = {}) {
  fromMock
    .mockReturnValueOnce(createBuilder({ data: asistencia, error: null }))
    .mockReturnValueOnce(createBuilder({ data: evaluaciones, error: null }))
    .mockReturnValueOnce(createBuilder({ data: observaciones, error: null }))
    .mockReturnValueOnce(createBuilder({ data: tareas, error: null }))
    .mockReturnValueOnce(createBuilder({ data: desempeno, error: null }))
    .mockReturnValueOnce(createBuilder({ data: notas, error: null }))   // notas (sequential)
    .mockReturnValueOnce(createBuilder({ data: entregas, error: null })); // entregas (sequential)
}

describe("useStudentMetrics", () => {
  beforeEach(() => {
    fromMock.mockReset();
    fromMock.mockReturnValue(safeBuilder());
  });

  async function getMetrics(opts?: Parameters<typeof setupFetches>[0]): Promise<StudentMetrics> {
    setupFetches(opts);
    const { result } = renderHook(() => useStudentMetrics());
    let metrics!: StudentMetrics;
    await act(async () => {
      metrics = await result.current.fetchMetrics("student-1", "clase-1");
    });
    return metrics;
  }

  it("calculates attendance percentage: presente + tarde count as present", async () => {
    const metrics = await getMetrics({
      asistencia: [
        { estado: "presente" },
        { estado: "presente" },
        { estado: "presente" },
        { estado: "tarde" },  // also counts
        { estado: "falta" },  // does NOT count
      ],
    });

    // 4 present (3 presente + 1 tarde) out of 5 → 80%
    expect(metrics.asistencia).toBe(80);
  });

  it("calculates grade average and evaluaciones list", async () => {
    const metrics = await getMetrics({
      evaluaciones: [
        { id: "e1", nombre: "Parcial 1", fecha: "2026-03-01" },
        { id: "e2", nombre: "Parcial 2", fecha: "2026-03-15" },
      ],
      notas: [
        { evaluacion_id: "e1", nota: 8 },
        { evaluacion_id: "e2", nota: 10 },
      ],
    });

    // (8 + 10) / 2 = 9.0
    expect(metrics.promedio).toBe(9);
    expect(metrics.evaluaciones).toHaveLength(2);
    expect(metrics.evaluaciones[0]).toMatchObject({ nombre: "Parcial 1", nota: 8 });
  });

  it("maps desempeno NIVEL_MAP values to numeric averages and derives participacion label", async () => {
    // NIVEL_MAP: B=0, M=1, A=2, A+=3
    const metrics = await getMetrics({
      desempeno: [
        { tarea: "A", participacion_oral: "A+", rendimiento_aula: "M", conducta: "B" },
        { tarea: "M", participacion_oral: "A",  rendimiento_aula: "A", conducta: "M" },
      ],
    });

    // tarea: (2+1)/2 = 1.5
    expect(metrics.desempeno.tarea).toBeCloseTo(1.5);
    // participacion_oral: (3+2)/2 = 2.5 → "Alta" (>= 2)
    expect(metrics.desempeno.participacion_oral).toBeCloseTo(2.5);
    expect(metrics.participacion).toBe("Alta");
    // conducta: (0+1)/2 = 0.5
    expect(metrics.desempeno.conducta).toBeCloseTo(0.5);
  });

  it("returns safe zeros for all-empty data (no divide-by-zero)", async () => {
    const metrics = await getMetrics();

    expect(metrics.asistencia).toBe(0);
    expect(metrics.promedio).toBe(0);
    expect(metrics.tareasEntregadas).toBe(0);
    expect(metrics.tareasTotal).toBe(0);
    expect(metrics.evaluaciones).toHaveLength(0);
    expect(metrics.observaciones).toHaveLength(0);
  });

  it("counts homework delivery correctly", async () => {
    const metrics = await getMetrics({
      tareas: [{ id: "t1" }, { id: "t2" }, { id: "t3" }],
      entregas: [{ id: "entr-1" }, { id: "entr-2" }],
    });

    expect(metrics.tareasTotal).toBe(3);
    expect(metrics.tareasEntregadas).toBe(2);
  });
});
