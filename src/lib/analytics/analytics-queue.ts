export type AnalyticsEventInput = {
  eventType: string;
  appId?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
};

export type QueuedAnalyticsEvent = {
  id: string;
  sessionId: string;
  eventType: string;
  appId?: string;
  occurredAt: string;
  duration?: number;
  metadata: Record<string, unknown>;
};

export type AnalyticsTransport = {
  send(events: QueuedAnalyticsEvent[]): Promise<void>;
};

export type AnalyticsQueue = {
  track(event: AnalyticsEventInput): QueuedAnalyticsEvent;
  flush(): Promise<{ ok: boolean; sent: number }>;
  size(): number;
  snapshot(): QueuedAnalyticsEvent[];
};

export function createAnalyticsQueue({
  transport,
  sessionId,
  disabled = false,
}: {
  transport: AnalyticsTransport;
  sessionId: string;
  disabled?: boolean;
}): AnalyticsQueue {
  let queuedEvents: QueuedAnalyticsEvent[] = [];

  return {
    track(event) {
      if (disabled) {
        return {
          id: "disabled",
          sessionId,
          eventType: event.eventType,
          appId: event.appId,
          occurredAt: new Date().toISOString(),
          duration: event.duration,
          metadata: event.metadata ?? {},
        };
      }

      const queuedEvent: QueuedAnalyticsEvent = {
        id: createEventId(),
        sessionId,
        eventType: event.eventType,
        appId: event.appId,
        occurredAt: new Date().toISOString(),
        duration: event.duration,
        metadata: event.metadata ?? {},
      };

      queuedEvents = [...queuedEvents, queuedEvent];
      return queuedEvent;
    },
    async flush() {
      if (disabled) {
        queuedEvents = [];
        return { ok: true, sent: 0 };
      }

      const batch = queuedEvents;

      if (batch.length === 0) {
        return { ok: true, sent: 0 };
      }

      try {
        await transport.send(batch);
        queuedEvents = queuedEvents.slice(batch.length);
        return { ok: true, sent: batch.length };
      } catch {
        return { ok: false, sent: 0 };
      }
    },
    size() {
      return queuedEvents.length;
    },
    snapshot() {
      return [...queuedEvents];
    },
  };
}

function createEventId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `event-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
