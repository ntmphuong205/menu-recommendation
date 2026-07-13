import { useEffect, useRef, useState } from "react";

/**
 * State persisted to localStorage and kept in sync across browser tabs
 * (e.g. a customer tab placing an order and an owner-dashboard tab watching it live).
 */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  const skipNextWrite = useRef(false);

  useEffect(() => {
    if (skipNextWrite.current) {
      skipNextWrite.current = false;
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key || e.newValue == null) return;
      try {
        skipNextWrite.current = true;
        setValue(JSON.parse(e.newValue) as T);
      } catch {
        // ignore malformed payloads from other tabs
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]);

  return [value, setValue] as const;
}
