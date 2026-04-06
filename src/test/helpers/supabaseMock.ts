import { vi } from "vitest";

/**
 * Creates a Supabase-style chainable query builder that resolves to `response` when awaited.
 * Every chaining method returns `this`, making the full chain awaitable at any point.
 *
 * Usage:
 *   fromMock.mockReturnValueOnce(createBuilder({ data: rows, error: null }));
 */
export function createBuilder(response: { data?: any; error?: any } = { data: null, error: null }) {
  const builder: Record<string, any> = {};
  const chainMethods = [
    "select", "eq", "neq", "in", "not", "order", "limit",
    "single", "maybeSingle", "insert", "update", "delete",
    "upsert", "filter", "match", "is",
  ];
  for (const m of chainMethods) {
    builder[m] = vi.fn(() => builder);
  }
  // Make the builder awaitable — `await builder` returns `response`.
  builder.then = (onFulfilled: any, onRejected: any) =>
    Promise.resolve(response).then(onFulfilled, onRejected);
  return builder;
}

/** A safe no-op builder used as the default `mockReturnValue` fallback. */
export const safeBuilder = () => createBuilder({ data: null, error: null });
