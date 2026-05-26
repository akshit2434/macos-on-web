import type { LucideIcon } from "lucide-react";

export type AppCategory = "system" | "personal" | "media" | "game" | "utility";

export type AppDefinition = {
  id: string;
  name: string;
  category: AppCategory;
  icon: LucideIcon;
  iconSrc?: string;
  accent: string;
  defaultSize: {
    width: number;
    height: number;
  };
  minSize: {
    width: number;
    height: number;
  };
  dock: boolean;
  desktop?: boolean;
  menuItems: string[];
};

export type ToastNotification = {
  id: string;
  appId: string;
  title: string;
  body: string;
  createdAt: string;
};
