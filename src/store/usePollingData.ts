import { useEffect, useRef, useState } from "react";

/**
 * Polls `fetcher` every `intervalMs` (5s, matching the interval Wexit's
 * admin/app pages already proved out) and keeps the last good result on
 * a failed tick instead of clearing the screen.
 */
export function usePollingData<T>(fetcher: () => Promise<T>, intervalMs = 5000): T | null {
  const [data, setData] = useState<T | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const result = await fetcherRef.current();
        if (!cancelled) setData(result);
      } catch {
        // keep showing the last good data; the next poll retries
      }
    };
    tick();
    const id = setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs]);

  return data;
}
