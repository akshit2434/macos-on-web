import { ChevronLeft, ChevronRight, Grid2X2, List, MoreHorizontal, Share, Tag } from "lucide-react";
import type { ReactNode } from "react";

import type { FinderFileRecord } from "@/content/apps/files";
import { cn } from "@/lib/utils";
import type { FinderView } from "./finder-types";

export function FinderToolbar({
  folderName,
  subtitle,
  view,
  selectedFile,
  actionMenuOpen,
  selectedFileTagged,
  backDisabled,
  forwardDisabled,
  onBack,
  onForward,
  onViewChange,
  onShare,
  onToggleTag,
  onToggleActions,
  onQuickLook,
  onCopyName,
  onGetInfo,
}: {
  folderName: string;
  subtitle: string;
  view: FinderView;
  selectedFile: FinderFileRecord | null;
  actionMenuOpen: boolean;
  selectedFileTagged: boolean;
  backDisabled: boolean;
  forwardDisabled: boolean;
  onBack: () => void;
  onForward: () => void;
  onViewChange: (view: FinderView) => void;
  onShare: () => void;
  onToggleTag: () => void;
  onToggleActions: () => void;
  onQuickLook: () => void;
  onCopyName: () => void;
  onGetInfo: () => void;
}) {
  return (
    <header className="flex items-center justify-between border-b border-black/10 bg-[#f7f7f9]/90 px-4 backdrop-blur-xl">
      <div className="flex min-w-0 items-center gap-2">
        <ToolbarIcon label="Back" disabled={backDisabled} onClick={onBack}><ChevronLeft className="size-4" /></ToolbarIcon>
        <ToolbarIcon label="Forward" disabled={forwardDisabled} onClick={onForward}><ChevronRight className="size-4" /></ToolbarIcon>
        <div className="ml-2 min-w-0">
          <h1 className="truncate text-[15px] font-semibold">{folderName}</h1>
          <p className="text-[11px] text-slate-500">{subtitle}</p>
        </div>
      </div>
      <div className="relative flex shrink-0 items-center gap-2">
        <div className="flex overflow-hidden rounded-md bg-black/5 p-0.5 ring-1 ring-black/10">
          <ToolbarIcon label="Icon view" active={view === "icon"} onClick={() => onViewChange("icon")}><Grid2X2 className="size-4" /></ToolbarIcon>
          <ToolbarIcon label="List view" active={view === "list"} onClick={() => onViewChange("list")}><List className="size-4" /></ToolbarIcon>
        </div>
        <ToolbarIcon label="Share selected file" disabled={!selectedFile} onClick={onShare}><Share className="size-4" /></ToolbarIcon>
        <ToolbarIcon label="Tag selected file" active={selectedFileTagged} disabled={!selectedFile} onClick={onToggleTag}><Tag className="size-4" /></ToolbarIcon>
        <ToolbarIcon label="More actions" active={actionMenuOpen} disabled={!selectedFile} onClick={onToggleActions}><MoreHorizontal className="size-4" /></ToolbarIcon>
        {actionMenuOpen && selectedFile ? (
          <div className="absolute right-0 top-9 z-30 w-52 overflow-hidden rounded-xl border border-black/10 bg-white/95 py-1 text-[13px] shadow-2xl backdrop-blur-xl">
            <button type="button" className="w-full px-3 py-2 text-left hover:bg-sky-50" onClick={onQuickLook}>
              Quick Look
            </button>
            <button type="button" className="w-full px-3 py-2 text-left hover:bg-sky-50" onClick={onCopyName}>
              Copy Name
            </button>
            <button type="button" className="w-full px-3 py-2 text-left hover:bg-sky-50" onClick={onGetInfo}>
              Get Info
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}

function ToolbarIcon({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid size-7 place-items-center rounded text-slate-700 hover:bg-black/[0.08] disabled:cursor-not-allowed disabled:opacity-35",
        active && "bg-white shadow-sm",
      )}
    >
      {children}
    </button>
  );
}
