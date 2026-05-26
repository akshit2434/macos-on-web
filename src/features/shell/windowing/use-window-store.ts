"use client";

import { create } from "zustand";

import { getAppDefinition } from "../apps";
import type { ToastNotification } from "../types";
import {
  closeWindow,
  createInitialWindowState,
  focusWindow,
  minimizeWindow,
  moveWindow,
  openWindow,
  resizeWindow,
  toggleMaximizeWindow,
  type WindowPosition,
  type WindowSize,
  type WindowState,
} from "./window-reducer";

type WindowStore = WindowState & {
  notifications: ToastNotification[];
  openApp(appId: string): void;
  focusApp(windowId: string): void;
  closeApp(windowId: string): void;
  minimizeApp(windowId: string): void;
  maximizeApp(windowId: string): void;
  moveApp(windowId: string, position: WindowPosition): void;
  resizeApp(windowId: string, size: WindowSize): void;
  notify(notification: Omit<ToastNotification, "id" | "createdAt">): void;
  dismissNotification(id: string): void;
};

export const useWindowStore = create<WindowStore>((set) => ({
  ...createInitialWindowState(),
  notifications: [],
  openApp(appId) {
    const app = getAppDefinition(appId);

    if (!app) {
      return;
    }

    set((state) =>
      openWindow(state, {
        appId,
        title: app.name,
        size: app.defaultSize,
        position: {
          x: 92 + state.windows.length * 28,
          y: 64 + state.windows.length * 24,
        },
      }),
    );
  },
  focusApp(windowId) {
    set((state) => focusWindow(state, windowId));
  },
  closeApp(windowId) {
    set((state) => closeWindow(state, windowId));
  },
  minimizeApp(windowId) {
    set((state) => minimizeWindow(state, windowId));
  },
  maximizeApp(windowId) {
    set((state) => toggleMaximizeWindow(state, windowId));
  },
  moveApp(windowId, position) {
    set((state) => moveWindow(state, windowId, position));
  },
  resizeApp(windowId, size) {
    set((state) => resizeWindow(state, windowId, size));
  },
  notify(notification) {
    set((state) => ({
      notifications: [
        {
          ...notification,
          id: `notification-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          createdAt: new Date().toISOString(),
        },
        ...state.notifications,
      ].slice(0, 4),
    }));
  },
  dismissNotification(id) {
    set((state) => ({
      notifications: state.notifications.filter((notification) => notification.id !== id),
    }));
  },
}));

