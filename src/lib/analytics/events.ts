export const analyticsEvents = {
  deviceOpened: "DEVICE_OPENED",
  loginViewed: "LOGIN_SCREEN_VIEWED",
  faceIdStarted: "FACE_ID_STARTED",
  faceIdSuccess: "FACE_ID_SUCCESS",
  faceIdFailed: "FACE_ID_FAILED",
  deviceUnlocked: "DEVICE_UNLOCKED",
  deviceLocked: "DEVICE_LOCKED",
  appOpened: "APP_OPENED",
  appClosed: "APP_CLOSED",
  appFocused: "APP_FOCUSED",
  appMinimized: "APP_MINIMIZED",
  appMaximized: "APP_MAXIMIZED",
  notificationShown: "NOTIFICATION_SHOWN",
  notificationTapped: "NOTIFICATION_TAPPED",
} as const;

