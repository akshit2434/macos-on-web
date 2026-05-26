"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { ComponentType } from "react";
import { useEffect } from "react";

import { getLockedAppMessage, isAppLockedForSession } from "@/features/session/app-locks";
import { useSessionMode } from "@/features/session/session-mode";
import { useAnalytics } from "@/lib/analytics/use-analytics";
import { getAppDefinition } from "../apps";
import { useWindowStore } from "../windowing/use-window-store";

const NOTIFICATION_AUTO_DISMISS_MS = 4_800;

export function NotificationStack() {
  const notifications = useWindowStore((state) => state.notifications);
  const dismiss = useWindowStore((state) => state.dismissNotification);
  const openApp = useWindowStore((state) => state.openApp);
  const notify = useWindowStore((state) => state.notify);
  const { track } = useAnalytics();
  const sessionMode = useSessionMode();

  return (
    <div className="absolute right-4 top-12 z-[180] flex w-[340px] flex-col gap-2">
      <AnimatePresence>
        {notifications.map((notification) => {
          const app = getAppDefinition(notification.appId);
          const Icon = app?.icon;
          return (
            <NotificationCard
              key={notification.id}
              appAccent={app?.accent ?? "#64748b"}
              appIcon={Icon}
              notification={notification}
              onDismiss={() => {
                dismiss(notification.id);
                track({ eventType: "NOTIFICATION_DISMISSED", appId: notification.appId, metadata: { reason: "manual" } });
              }}
              onOpen={() => {
                if (isAppLockedForSession(notification.appId, sessionMode)) {
                  notify({ appId: notification.appId, title: "App locked", body: getLockedAppMessage(notification.appId) });
                  track({ eventType: "LOCKED_APP_OPEN_ATTEMPTED", appId: notification.appId });
                  return;
                }

                openApp(notification.appId);
                track({ eventType: "NOTIFICATION_TAPPED", appId: notification.appId });
              }}
              onTimeout={() => {
                dismiss(notification.id);
                track({ eventType: "NOTIFICATION_DISMISSED", appId: notification.appId, metadata: { reason: "timeout" } });
              }}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function NotificationCard({
  appAccent,
  appIcon: Icon,
  notification,
  onDismiss,
  onOpen,
  onTimeout,
}: {
  appAccent: string;
  appIcon?: ComponentType<{ className?: string }>;
  notification: {
    id: string;
    appId: string;
    title: string;
    body: string;
  };
  onDismiss: () => void;
  onOpen: () => void;
  onTimeout: () => void;
}) {
  useEffect(() => {
    const timeout = window.setTimeout(onTimeout, NOTIFICATION_AUTO_DISMISS_MS);
    return () => window.clearTimeout(timeout);
  }, [notification.id, onTimeout]);

  return (
    <motion.article
      initial={{ opacity: 0, x: 42, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 34, y: -6, scale: 0.96, filter: "blur(2px)" }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-white/30 bg-white/70 p-3 text-slate-950 shadow-2xl backdrop-blur-2xl"
    >
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onOpen}
          className="grid size-10 shrink-0 place-items-center rounded-xl text-white"
          style={{ background: appAccent }}
        >
          {Icon ? <Icon className="size-5" /> : null}
        </button>
        <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-semibold">{notification.title}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-slate-700">{notification.body}</p>
        </button>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="grid size-6 place-items-center rounded-full hover:bg-black/10"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </motion.article>
  );
}
