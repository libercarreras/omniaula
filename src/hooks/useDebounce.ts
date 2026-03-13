import { useEffect, useRef, useCallback } from "react";

/**
 * Debounced auto-save hook optimized for rapid interactions (Android perf).
 * Uses refs instead of state for "pending" tracking to avoid extra re-renders.
 * Only triggers a React re-render when status transitions to "saving" / "saved" / "idle".
 */
export function useDebounceCallback(callback: () => Promise<void> | void, delay = 2000) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  // Use a ref for pending to avoid re-renders on every keystroke/tap
  const statusRef = useRef<"idle" | "pending" | "saving" | "saved">("idle");

  const trigger = useCallback(() => {
    statusRef.current = "pending";
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      statusRef.current = "saving";
      try {
        await callbackRef.current();
        statusRef.current = "saved";
        setTimeout(() => { statusRef.current = "idle"; }, 2000);
      } catch (err) {
        console.error("[OmniAula][AutoSave] Error en guardado automático:", err, "| Timestamp:", new Date().toISOString());
        statusRef.current = "idle";
      }
    }, delay);
  }, [delay]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Expose status as a getter for components that need it without causing re-renders
  return { trigger, get status() { return statusRef.current; } };
}
