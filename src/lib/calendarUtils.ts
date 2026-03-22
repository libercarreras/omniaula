/**
 * Shared calendar utilities for parsing schedules and computing class dates.
 * Used by both the distribute-program edge function and the frontend PlanificacionTimeline.
 *
 * IMPORTANT: keep this file free of any DOM / Supabase / Deno-specific imports so it
 * can be consumed from both runtimes.
 */

const DIAS_MAP: Record<string, number> = {
  domingo: 0, lunes: 1, martes: 2, miercoles: 3, "miércoles": 3,
  jueves: 4, viernes: 5, sabado: 6, "sábado": 6,
  dom: 0, lun: 1, mar: 2, mie: 3, "mié": 3,
  jue: 4, vie: 5, sab: 6, "sáb": 6,
};

/**
 * Extract weekday numbers (0 = Sun … 6 = Sat) from a free-text schedule string
 * like "Lun/Mié 08:00-09:30".
 */
export function parseHorarioDias(horario: string | null): number[] {
  if (!horario) return [];
  const lower = horario.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const found: number[] = [];
  const sortedKeys = Object.entries(DIAS_MAP).sort((a, b) => b[0].length - a[0].length);
  for (const [key, val] of sortedKeys) {
    const normKey = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (lower.includes(normKey) && !found.includes(val)) {
      found.push(val);
    }
  }
  return found.sort((a, b) => a - b);
}

/**
 * Return all occurrences of a given weekday between startDate and endDate (inclusive),
 * as ISO date strings (YYYY-MM-DD).
 */
export function getClassDates(diaNum: number, startDate: Date, endDate: Date): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);

  // Move to first occurrence of this day
  while (current.getDay() !== diaNum) {
    current.setDate(current.getDate() + 1);
  }

  while (current <= endDate) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 7);
  }

  return dates;
}

/**
 * Get future class dates starting from a given date, respecting the schedule days.
 * Returns at most `count` dates.
 */
export function getFutureClassDates(
  horario: string | null,
  fromDate: Date,
  count: number,
  endDate?: Date,
): string[] {
  const dias = parseHorarioDias(horario);
  if (dias.length === 0) return [];

  const fallbackEnd = endDate ?? new Date(fromDate.getFullYear(), 11, 31);
  let allDates: string[] = [];
  for (const diaNum of dias) {
    allDates = allDates.concat(getClassDates(diaNum, fromDate, fallbackEnd));
  }
  allDates.sort();
  return allDates.slice(0, count);
}
