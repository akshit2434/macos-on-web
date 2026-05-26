export type WindowPosition = {
  x: number;
  y: number;
};

export type WindowSize = {
  width: number;
  height: number;
};

export type DesktopWindow = {
  id: string;
  appId: string;
  title: string;
  position: WindowPosition;
  size: WindowSize;
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
};

export type WindowState = {
  windows: DesktopWindow[];
  focusedWindowId: string | null;
  nextZIndex: number;
};

export type OpenWindowInput = {
  appId: string;
  title: string;
  position?: WindowPosition;
  size?: WindowSize;
};

const defaultSize: WindowSize = { width: 860, height: 580 };
const defaultPosition: WindowPosition = { x: 120, y: 74 };

export function createInitialWindowState(): WindowState {
  return {
    windows: [],
    focusedWindowId: null,
    nextZIndex: 1,
  };
}

export function openWindow(state: WindowState, input: OpenWindowInput): WindowState {
  const existing = state.windows.find((window) => window.appId === input.appId);

  if (existing) {
    return focusWindow(state, existing.id);
  }

  const window: DesktopWindow = {
    id: input.appId,
    appId: input.appId,
    title: input.title,
    position: input.position ?? defaultPosition,
    size: input.size ?? defaultSize,
    zIndex: state.nextZIndex,
    isMinimized: false,
    isMaximized: false,
  };

  return {
    windows: [...state.windows, window],
    focusedWindowId: window.id,
    nextZIndex: state.nextZIndex + 1,
  };
}

export function focusWindow(state: WindowState, windowId: string): WindowState {
  const target = state.windows.find((window) => window.id === windowId);

  if (!target) {
    return state;
  }

  return {
    windows: state.windows.map((window) =>
      window.id === windowId
        ? {
            ...window,
            isMinimized: false,
            zIndex: state.nextZIndex,
          }
        : window,
    ),
    focusedWindowId: windowId,
    nextZIndex: state.nextZIndex + 1,
  };
}

export function minimizeWindow(state: WindowState, windowId: string): WindowState {
  const windows = state.windows.map((window) =>
    window.id === windowId ? { ...window, isMinimized: true } : window,
  );

  return {
    ...state,
    windows,
    focusedWindowId: state.focusedWindowId === windowId ? null : state.focusedWindowId,
  };
}

export function toggleMaximizeWindow(state: WindowState, windowId: string): WindowState {
  return {
    ...state,
    windows: state.windows.map((window) =>
      window.id === windowId ? { ...window, isMaximized: !window.isMaximized } : window,
    ),
  };
}

export function hasMaximizedWindow(windows: DesktopWindow[]) {
  return windows.some((window) => window.isMaximized && !window.isMinimized);
}

export function closeWindow(state: WindowState, windowId: string): WindowState {
  const remainingWindows = state.windows.filter((window) => window.id !== windowId);
  const focusedWindowId =
    state.focusedWindowId === windowId ? getTopWindowId(remainingWindows) : state.focusedWindowId;

  return {
    ...state,
    windows: remainingWindows,
    focusedWindowId,
  };
}

export function moveWindow(
  state: WindowState,
  windowId: string,
  position: WindowPosition,
): WindowState {
  return {
    ...state,
    windows: state.windows.map((window) =>
      window.id === windowId ? { ...window, position } : window,
    ),
  };
}

export function resizeWindow(state: WindowState, windowId: string, size: WindowSize): WindowState {
  return {
    ...state,
    windows: state.windows.map((window) => (window.id === windowId ? { ...window, size } : window)),
  };
}

function getTopWindowId(windows: DesktopWindow[]): string | null {
  if (windows.length === 0) {
    return null;
  }

  return windows.reduce((topWindow, window) =>
    window.zIndex > topWindow.zIndex ? window : topWindow,
  ).id;
}
