import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { useDebounceCallback } from "@/hooks/useDebounce";

describe("useDebounceCallback", () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it("starts with idle status", () => {
    const { result } = renderHook(() => useDebounceCallback(vi.fn(), 500));
    expect(result.current.status).toBe("idle");
  });

  it("transitions idle → pending on trigger, then → saved after delay", async () => {
    const callback = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useDebounceCallback(callback, 500));

    act(() => { result.current.trigger(); });
    expect(result.current.status).toBe("pending");

    // Fire the debounce timer and let the async callback complete
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });
    expect(result.current.status).toBe("saved");
  });

  it("reverts to idle after the 2000ms saved-display window", async () => {
    const callback = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useDebounceCallback(callback, 100));

    act(() => { result.current.trigger(); });
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    expect(result.current.status).toBe("saved");

    await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
    expect(result.current.status).toBe("idle");
  });

  it("debounces rapid calls — callback invoked exactly once", async () => {
    const callback = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useDebounceCallback(callback, 300));

    act(() => {
      result.current.trigger();
      result.current.trigger();
      result.current.trigger();
    });

    await act(async () => { await vi.advanceTimersByTimeAsync(300); });
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("returns to idle (not stuck on saving) after a callback error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const callback = vi.fn().mockRejectedValue(new Error("network error"));
    const { result } = renderHook(() => useDebounceCallback(callback, 100));

    act(() => { result.current.trigger(); });
    await act(async () => { await vi.advanceTimersByTimeAsync(100); });
    expect(result.current.status).toBe("idle");

    consoleSpy.mockRestore();
  });
});
