"use client";

import {
  Clock3,
  Folder,
  Heart,
  LockKeyhole,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { filesContent, type FinderFolderRecord } from "@/content/apps/files";
import { useAnalytics } from "@/lib/analytics/use-analytics";
import { cn } from "@/lib/utils";
import { EmptySearchState, FinderFileList } from "./FinderFileList";
import { FinderPreview, LockedFolderState } from "./FinderPreview";
import { FinderToolbar } from "./FinderToolbar";
import type { FinderView } from "./finder-types";

type FinderHistory = {
  back: string[];
  forward: string[];
};

export function FinderApp() {
  const [folderId, setFolderId] = useState(filesContent.folders[0].id);
  const [preview, setPreview] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<FinderView>("icon");
  const [toast, setToast] = useState<string | null>(null);
  const [history, setHistory] = useState<FinderHistory>({ back: [], forward: [] });
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [locallyTaggedFileIds, setLocallyTaggedFileIds] = useState<string[]>([]);
  const { track } = useAnalytics();
  const folder = filesContent.folders.find((item) => item.id === folderId) ?? filesContent.folders[0];
  const folderLocked = Boolean(folder.locked);
  const files = useMemo(
    () =>
      folderLocked
        ? []
        : folder.files.filter((file) => file.name.toLowerCase().includes(query.trim().toLowerCase())),
    [folder, folderLocked, query],
  );
  const selectedFile = folderLocked ? null : (folder.files.find((file) => file.id === preview) ?? null);

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => setToast(null), 1600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function openFolder(item: FinderFolderRecord) {
    if (item.id === folderId) {
      return;
    }

    setHistory((current) => ({ back: [...current.back, folderId], forward: [] }));
    navigateToFolder(item.id);

    if (item.locked) {
      setToast("Hidden is locked");
      track({ eventType: "FILES_LOCKED_FOLDER_ATTEMPTED", appId: "finder", metadata: { folderId: item.id } });
      return;
    }

    track({ eventType: "FILES_FOLDER_OPENED", appId: "finder", metadata: { folderId: item.id } });
  }

  function navigateToFolder(nextFolderId: string) {
    setFolderId(nextFolderId);
    setPreview(null);
    setActionMenuOpen(false);
  }

  function goBack() {
    const previousFolderId = history.back.at(-1);
    if (!previousFolderId) {
      return;
    }

    setHistory((current) => ({
      back: current.back.slice(0, -1),
      forward: [folderId, ...current.forward],
    }));
    setFolderId(previousFolderId);
    setPreview(null);
    setActionMenuOpen(false);
    track({ eventType: "FILES_NAVIGATED_BACK", appId: "finder", metadata: { folderId: previousFolderId } });
  }

  function goForward() {
    const nextFolderId = history.forward[0];
    if (!nextFolderId) {
      return;
    }

    setHistory((current) => ({
      back: [...current.back, folderId],
      forward: current.forward.slice(1),
    }));
    setFolderId(nextFolderId);
    setPreview(null);
    setActionMenuOpen(false);
    track({ eventType: "FILES_NAVIGATED_FORWARD", appId: "finder", metadata: { folderId: nextFolderId } });
  }

  function showLocalAction(label: string) {
    setActionMenuOpen(false);
    setToast(label);
    track({ eventType: "FINDER_LOCAL_ACTION", appId: "finder", metadata: { label, fileId: selectedFile?.id } });
  }

  function toggleSelectedTag() {
    if (!selectedFile) {
      return;
    }

    setLocallyTaggedFileIds((current) => {
      const isTagged = current.includes(selectedFile.id);
      return isTagged ? current.filter((id) => id !== selectedFile.id) : [...current, selectedFile.id];
    });
    showLocalAction(locallyTaggedFileIds.includes(selectedFile.id) ? "Local tag removed." : "Tagged locally.");
  }

  function copySelectedFileName() {
    if (!selectedFile) {
      return;
    }

    const writePromise = navigator.clipboard?.writeText(selectedFile.name);
    void writePromise?.catch(() => undefined);
    showLocalAction("File name copied.");
  }

  return (
    <div className="grid h-full grid-cols-[200px_1fr] overflow-hidden bg-[#f7f7f8] text-slate-950">
      <aside className="flex min-h-0 flex-col border-r border-black/10 bg-[#e9e9ed]/95 p-3 backdrop-blur-xl">
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-white/75 px-2 py-1.5 text-sm shadow-inner ring-1 ring-black/5">
          <Search className="size-4 text-slate-500" />
          <input
            aria-label="Search Finder"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            className="min-w-0 flex-1 bg-transparent outline-none"
          />
        </div>
        <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Favorites</p>
        {filesContent.folders.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-label={item.name}
            onClick={() => openFolder(item)}
            className={cn(
              "mb-1 flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-[13px]",
              folderId === item.id ? "bg-white/85 font-semibold shadow-sm" : "hover:bg-white/50",
            )}
          >
            <SidebarIcon folder={item} />
            <span className="min-w-0 flex-1 truncate">{item.name}</span>
            <span className="text-[11px] text-slate-500">{item.locked ? "" : item.files.length}</span>
          </button>
        ))}
        <div className="mt-auto rounded-lg bg-white/45 p-3 text-[11px] leading-4 text-slate-600 ring-1 ring-black/5">
          Quick Look previews stay local until real personal files are supplied.
        </div>
      </aside>

      <section className="grid min-h-0 grid-rows-[50px_1fr_28px] overflow-hidden">
        <FinderToolbar
          folderName={folder.name}
          subtitle={folderLocked ? "Locked" : `${files.length} item${files.length === 1 ? "" : "s"}`}
          view={view}
          selectedFile={selectedFile}
          actionMenuOpen={actionMenuOpen}
          selectedFileTagged={selectedFile ? locallyTaggedFileIds.includes(selectedFile.id) : false}
          backDisabled={history.back.length === 0}
          forwardDisabled={history.forward.length === 0}
          onBack={goBack}
          onForward={goForward}
          onViewChange={setView}
          onShare={() => showLocalAction("Share sheet prepared locally.")}
          onToggleTag={toggleSelectedTag}
          onToggleActions={() => setActionMenuOpen((open) => !open)}
          onQuickLook={() => showLocalAction("Quick Look is already visible.")}
          onCopyName={copySelectedFileName}
          onGetInfo={() => selectedFile && showLocalAction(`${selectedFile.kind} - ${selectedFile.size}`)}
        />

        <div className="grid min-h-0 grid-cols-[minmax(320px,1fr)_330px] overflow-hidden">
          <main className="min-h-0 overflow-auto p-5">
            {folderLocked ? <LockedFolderState /> : null}
            {!folderLocked && files.length === 0 ? <EmptySearchState query={query} /> : null}
            {!folderLocked && files.length > 0 ? (
              <FinderFileList files={files} selectedFile={selectedFile} locallyTaggedFileIds={locallyTaggedFileIds} view={view} onSelect={(file) => {
                setPreview(file.id);
                setActionMenuOpen(false);
                track({ eventType: "FILES_FILE_OPENED", appId: "finder", metadata: { fileId: file.id } });
              }} />
            ) : null}
          </main>

          <FinderPreview file={selectedFile} locked={folderLocked} />
        </div>

        <footer className="flex items-center justify-between border-t border-black/10 bg-[#f4f4f6] px-4 text-[11px] text-slate-500">
          <span>{folderLocked ? "0 items" : `${folder.files.length} items`}</span>
          <span>{selectedFile ? `${selectedFile.name} selected` : "No selection"}</span>
        </footer>
      </section>

      {toast ? (
        <div className="absolute bottom-5 left-1/2 z-30 -translate-x-1/2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-xl">
          {toast}
        </div>
      ) : null}
    </div>
  );
}

function SidebarIcon({ folder }: { folder: FinderFolderRecord }) {
  if (folder.locked) return <LockKeyhole className="size-4 text-slate-500" />;
  if (folder.icon === "heart") return <Heart className="size-4 text-rose-500" />;
  if (folder.icon === "clock") return <Clock3 className="size-4 text-sky-600" />;
  return <Folder className="size-4 text-sky-600" />;
}
