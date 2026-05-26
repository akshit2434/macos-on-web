"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";

import { createAnalyticsQueue, type AnalyticsEventInput } from "./analytics-queue";

type AnalyticsContextValue = {
  track(event: AnalyticsEventInput): void;
  flush(): Promise<void>;
  sessionId: string;
};

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

export function AnalyticsProvider({
  children,
  sessionId,
  disabled = false,
}: {
  children: React.ReactNode;
  sessionId: string;
  disabled?: boolean;
}) {
  const queue = useMemo(
    () =>
      createAnalyticsQueue({
        sessionId,
        disabled,
        transport: {
          async send(events) {
            const response = await fetch("/api/analytics/flush", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ events }),
              keepalive: true,
            });
            const result = (await response.json()) as { ok?: boolean; error?: string };

            if (!response.ok || !result.ok) {
              throw new Error(result.error ?? "Analytics flush failed");
            }
          },
        },
      }),
    [sessionId, disabled],
  );
  const flushRef = useRef<() => Promise<void>>(async () => {});

  const track = useCallback(
    (event: AnalyticsEventInput) => {
      queue.track(event);
    },
    [queue],
  );

  const flush = useCallback(async () => {
    await queue.flush();
  }, [queue]);

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void flushRef.current();
    }, 20_000);

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        void flushRef.current();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      void flushRef.current();
    };
  }, []);

  return (
    <AnalyticsContext.Provider value={{ track, flush, sessionId }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

export function useAnalytics() {
  const value = useContext(AnalyticsContext);

  if (!value) {
    return {
      sessionId: "local",
      track() {},
      async flush() {},
    } satisfies AnalyticsContextValue;
  }

  return value;
}
