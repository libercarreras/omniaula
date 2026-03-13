import { useEffect, useRef, useState, useCallback } from "react";

export function useDebounceCallback(callback: () => Promise<void> | void, delay = 2000) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  const [status, setStatus] = useState<"idle" | "pending" | "saving" | "saved">("idle");

  const trigger = useCallback(() => {
    setStatus("pending");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setStatus("saving");
      try {
        await callbackRef.current();
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 2000);
      } catch (err) {
        console.error("[OmniAula][AutoSave] Error en guardado automático:", err, "| Timestamp:", new Date().toISOString());
        setStatus("idle");
      }
    }, delay);
  }, [delay]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { trigger, status };
}
