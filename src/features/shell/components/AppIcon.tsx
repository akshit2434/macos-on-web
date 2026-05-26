"use client";

import type { AppDefinition } from "../types";

export function AppIcon({ app, size = "md" }: { app: AppDefinition; size?: "sm" | "md" | "lg" }) {
  const Icon = app.icon;
  const sizeClass = {
    sm: "size-9",
    md: "size-14",
    lg: "size-16",
  }[size];

  if (app.iconSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={app.iconSrc}
        alt=""
        draggable={false}
        className={`${sizeClass} select-none object-contain drop-shadow-[0_8px_14px_rgba(0,0,0,0.28)]`}
      />
    );
  }

  return (
    <span
      className={`${sizeClass} grid place-items-center rounded-[18px] shadow-lg ring-1 ring-white/25`}
      style={{ background: app.accent }}
    >
      <Icon className="size-1/2 text-white" strokeWidth={1.8} />
    </span>
  );
}
