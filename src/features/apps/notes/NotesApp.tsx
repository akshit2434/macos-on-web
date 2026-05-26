"use client";

import { Bold, CheckSquare, Eraser, Italic, List, LockKeyhole, Paintbrush, Plus, Search, Star, Trash2 } from "lucide-react";
import { type KeyboardEvent, type MouseEvent, type ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { notesContent, type NoteRecord } from "@/content/apps/notes";
import { resolveUnlockedNotes } from "@/features/content-unlocks/time-locked-content";
import { cn } from "@/lib/utils";
import { useAnalytics } from "@/lib/analytics/use-analytics";
import { insertBulletList, insertChecklist, insertInlineFormat, toggleChecklistTarget } from "./notes-editor-commands";
import { loadStoredNotesState, saveStoredNotesState, syncNotesStateToCloud } from "./notes-storage";

type StrokeTool = "brush" | "eraser";

export function NotesApp() {
  const [folder, setFolder] = useState(notesContent.folders[0]);
  const [query, setQuery] = useState("");
  const [notes, setNotes] = useState<NoteRecord[]>(notesContent.notes);
  const [selectedId, setSelectedId] = useState(notesContent.notes[0].id);
  const [unlockNow, setUnlockNow] = useState(() => new Date());
  const [deleteNotice, setDeleteNotice] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [drawingOpen, setDrawingOpen] = useState(false);
  const [strokeColor, setStrokeColor] = useState("#1f2937");
  const [strokeSize, setStrokeSize] = useState(3);
  const [tool, setTool] = useState<StrokeTool>("brush");
  const [doodles, setDoodles] = useState<Record<string, string | null>>({});
  const [storageHydrated, setStorageHydrated] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const editorSyncRef = useRef<{ noteId: string | null; body: string }>({ noteId: null, body: "" });
  const saveTimerRef = useRef<number | null>(null);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const { track } = useAnalytics();

  const displayNotes = useMemo(() => resolveUnlockedNotes(notes, unlockNow), [notes, unlockNow]);
  const visibleNotes = useMemo(
    () =>
      displayNotes.filter(
        (note) =>
          note.folder === folder &&
          `${note.title} ${note.body}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [displayNotes, folder, query],
  );
  const selected = displayNotes.find((note) => note.id === selectedId) ?? displayNotes[0] ?? notesContent.notes[0];
  const selectedLocked = selected.locked && !isUnlocked;
  const canEdit = !selected.readonly && !selectedLocked;
  const selectedDoodle = doodles[selected.id];

  useEffect(() => {
    const hydrate = window.setTimeout(() => {
      const stored = loadStoredNotesState();
      setNotes(stored.notes);
      setDoodles(stored.doodles);
      setSelectedId(resolveUnlockedNotes(stored.notes)[0]?.id ?? notesContent.notes[0].id);
      setStorageHydrated(true);
    }, 0);

    return () => window.clearTimeout(hydrate);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setUnlockNow(new Date()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!storageHydrated) return;

    const state = { notes, doodles };
    saveStoredNotesState(state);
    void syncNotesStateToCloud(state);
  }, [doodles, notes, storageHydrated]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!drawingOpen || !canEdit) return;

    const canvas = canvasRef.current;
    const ctx = prepareCanvas();
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!selectedDoodle) return;

    const restored = new Image();
    restored.onload = () => {
      ctx.drawImage(restored, 0, 0, canvas.getBoundingClientRect().width, canvas.getBoundingClientRect().height);
    };
    restored.src = selectedDoodle;
  }, [canEdit, drawingOpen, selected.id, selectedDoodle]);

  useLayoutEffect(() => {
    const editor = editorRef.current;
    if (!editor || selectedLocked) return;

    if (editorSyncRef.current.noteId !== selected.id || editorSyncRef.current.body !== selected.body) {
      editor.innerHTML = selected.body;
      editorSyncRef.current = { noteId: selected.id, body: selected.body };
    }
  }, [selected.body, selected.id, selectedLocked]);

  function selectNote(note: NoteRecord) {
    persistEditorBody({ immediate: true });
    setSelectedId(note.id);
    setDrawingOpen(false);
    setIsUnlocked(false);
    clearCanvas();
    track({ eventType: "NOTE_OPENED", appId: "notes", metadata: { noteId: note.id } });
  }

  function createNote() {
    persistEditorBody({ immediate: true });
    const noteId = window.crypto.randomUUID();
    const note: NoteRecord = {
      id: `note-${noteId}`,
      folder,
      title: "New Note",
      body: "",
      updatedAt: "Just now",
      updatedAtIso: new Date().toISOString(),
      author: "owner",
      readonly: false,
    };
    setNotes((value) => [note, ...value]);
    setSelectedId(note.id);
    setDrawingOpen(false);
    setDoodles((value) => ({ ...value, [note.id]: null }));
    clearCanvas();
    track({ eventType: "NOTE_CREATED", appId: "notes", metadata: { folder } });
  }

  function updateSelected(patch: Partial<NoteRecord>) {
    if (!canEdit) return;

    updateNote(selected.id, patch);
  }

  function updateNote(noteId: string, patch: Partial<NoteRecord>) {
    setNotes((value) =>
      value.map((note) =>
        note.id === noteId ? { ...note, ...patch, updatedAt: "Just now", updatedAtIso: new Date().toISOString() } : note,
      ),
    );
  }

  function persistEditorBody(options: { immediate?: boolean } = {}) {
    const editor = editorRef.current;
    if (!editor || !canEdit) return;

    const body = editor.innerHTML;
    const noteId = selected.id;
    editorSyncRef.current = { noteId, body };

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    const commit = () => updateNote(noteId, { body });
    if (options.immediate) {
      commit();
      return;
    }

    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      commit();
    }, 180);
  }

  function deleteSelected() {
    if (selected.readonly || selected.protected || selected.locked) {
      track({ eventType: "NOTE_DELETE_ATTEMPTED", appId: "notes", metadata: { noteId: selected.id, blocked: true } });
      setDeleteNotice(true);
      return;
    }

    const remaining = notes.filter((note) => note.id !== selected.id);
    const next = resolveUnlockedNotes(remaining).find((note) => note.folder === folder) ?? resolveUnlockedNotes(remaining)[0];
    setNotes(remaining);
    setDoodles((value) => {
      const nextDoodles = { ...value };
      delete nextDoodles[selected.id];
      return nextDoodles;
    });
    setSelectedId(next?.id ?? notesContent.notes[0].id);
    setDrawingOpen(false);
    clearCanvas();
    track({ eventType: "NOTE_DELETED", appId: "notes", metadata: { noteId: selected.id } });
  }

  function applyFormat(command: "bold" | "italic") {
    if (!canEdit) return;
    const editor = editorRef.current;
    if (!editor) return;

    insertInlineFormat(editor, command);
    persistEditorBody({ immediate: true });
    track({ eventType: "NOTE_FORMAT_APPLIED", appId: "notes", metadata: { command } });
  }

  function applyBulletList() {
    if (!canEdit) return;
    const editor = editorRef.current;
    if (!editor) return;

    insertBulletList(editor);
    persistEditorBody({ immediate: true });
    track({ eventType: "NOTE_FORMAT_APPLIED", appId: "notes", metadata: { command: "insertUnorderedList" } });
  }

  function applyChecklist() {
    if (!canEdit) return;
    const editor = editorRef.current;
    if (!editor) return;

    insertChecklist(editor);
    persistEditorBody({ immediate: true });
    track({ eventType: "NOTE_FORMAT_APPLIED", appId: "notes", metadata: { command: "checklist" } });
  }

  function handleEditorClick(event: MouseEvent<HTMLDivElement>) {
    if (!canEdit || !toggleChecklistTarget(event.target as HTMLElement)) return;
    persistEditorBody({ immediate: true });
  }

  function handleEditorKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (!target.closest(".notes-check") || (event.key !== " " && event.key !== "Enter")) return;

    event.preventDefault();
    target.click();
  }

  function getCanvasPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function prepareCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(rect.width * ratio) || canvas.height !== Math.round(rect.height * ratio)) {
      const snapshot = canvas.toDataURL();
      canvas.width = Math.round(rect.width * ratio);
      canvas.height = Math.round(rect.height * ratio);
      const restored = new Image();
      restored.onload = () => canvas.getContext("2d")?.drawImage(restored, 0, 0, canvas.width, canvas.height);
      restored.src = snapshot;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    return ctx;
  }

  function startDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!canEdit) return;
    lastPoint.current = getCanvasPoint(event);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function draw(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!canEdit || !lastPoint.current || event.buttons !== 1) return;
    const point = getCanvasPoint(event);
    const ctx = prepareCanvas();
    if (!point || !ctx) return;
    ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = tool === "eraser" ? strokeSize * 3 : strokeSize;
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPoint.current = point;
  }

  function stopDrawing(event: React.PointerEvent<HTMLCanvasElement>) {
    if (lastPoint.current) {
      persistCurrentDoodle();
      track({ eventType: "NOTE_DOODLE_UPDATED", appId: "notes", metadata: { noteId: selected.id } });
    }
    lastPoint.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function clearCanvas() {
    const canvas = canvasRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
  }

  function clearCurrentDoodle() {
    clearCanvas();
    setDoodles((value) => ({ ...value, [selected.id]: null }));
    track({ eventType: "NOTE_DOODLE_UPDATED", appId: "notes", metadata: { noteId: selected.id, cleared: true } });
  }

  function persistCurrentDoodle() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setDoodles((value) => ({ ...value, [selected.id]: canvas.toDataURL("image/png") }));
  }

  return (
    <div className="grid h-full grid-cols-[160px_220px_minmax(320px,1fr)] bg-[#f5f1e8] text-slate-950">
      <aside className="border-r border-black/10 bg-[#ebe7dc] p-3">
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-white/65 px-2 py-1.5 text-sm">
          <Search className="size-4 text-slate-500" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" className="min-w-0 flex-1 bg-transparent outline-none" />
        </div>
        <button type="button" onClick={createNote} className="mb-3 flex w-full items-center gap-2 rounded-lg bg-yellow-400/80 px-3 py-2 text-sm font-semibold hover:bg-yellow-400">
          <Plus className="size-4" />
          New Note
        </button>
        <div className="space-y-1">
          {notesContent.folders.map((folderName) => (
            <button
              key={folderName}
              type="button"
              onClick={() => setFolder(folderName)}
              className={cn("flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm", folder === folderName ? "bg-white/80 font-semibold" : "hover:bg-white/45")}
            >
              {folderName}
              <span className="text-xs text-slate-500">{displayNotes.filter((note) => note.folder === folderName).length}</span>
            </button>
          ))}
        </div>
      </aside>

      <section className="min-h-0 overflow-auto border-r border-black/10 bg-[#f8f5ee]">
        <div className="sticky top-0 z-10 border-b border-black/10 bg-[#f8f5ee]/90 p-4 backdrop-blur">
          <h2 className="text-sm font-semibold">{folder}</h2>
        </div>
        <div className="divide-y divide-black/10">
          {visibleNotes.map((note) => (
            <button key={note.id} type="button" onClick={() => selectNote(note)} className={cn("w-full px-4 py-3 text-left", selected.id === note.id ? "bg-yellow-200/70" : "hover:bg-white/55")}>
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold">{note.title}</p>
                {note.special ? <Star className="size-3.5 fill-amber-400 text-amber-500" aria-label="Special unlocked note" /> : null}
                {note.locked ? <LockKeyhole className="size-3.5 text-slate-500" /> : null}
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-slate-600">{note.body.replace(/<[^>]*>/g, "")}</p>
              <p className="mt-1 text-[11px] text-slate-500">{note.updatedAt}{note.readonly ? " - Read only" : ""}</p>
            </button>
          ))}
        </div>
      </section>

      <article className="relative flex h-full min-h-0 flex-col bg-[#fffdf8]">
        <header className="flex min-h-12 items-center justify-between gap-3 border-b border-black/10 px-5">
          <input
            value={selected.title}
            readOnly={!canEdit}
            onChange={(event) => updateSelected({ title: event.target.value })}
            className="min-w-0 flex-1 bg-transparent text-base font-semibold outline-none read-only:cursor-default"
          />
          <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto">
            <ToolbarButton label="Bold" disabled={!canEdit} onClick={() => applyFormat("bold")}><Bold className="size-4" /></ToolbarButton>
            <ToolbarButton label="Italic" disabled={!canEdit} onClick={() => applyFormat("italic")}><Italic className="size-4" /></ToolbarButton>
            <ToolbarButton label="Bullets" disabled={!canEdit} onClick={applyBulletList}><List className="size-4" /></ToolbarButton>
            <ToolbarButton label="Checklist" disabled={!canEdit} onClick={applyChecklist}><CheckSquare className="size-4" /></ToolbarButton>
            <ToolbarButton label="Doodle" disabled={!canEdit} onClick={() => setDrawingOpen((value) => !value)}><Paintbrush className="size-4" /></ToolbarButton>
            {selected.locked ? <button type="button" onClick={() => setIsUnlocked(true)} className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white">Unlock</button> : null}
            <ToolbarButton label="Delete note" onClick={deleteSelected}><Trash2 className="size-4" /></ToolbarButton>
          </div>
        </header>

        {drawingOpen && canEdit ? (
          <div className="flex h-11 items-center gap-3 border-b border-black/10 bg-[#fff8db] px-5 text-xs">
            <span className="font-semibold">Doodle</span>
            {["#1f2937", "#ef4444", "#2563eb", "#16a34a", "#f59e0b"].map((color) => (
              <button key={color} type="button" aria-label={`Color ${color}`} onClick={() => { setStrokeColor(color); setTool("brush"); }} className={cn("size-5 rounded-full ring-1 ring-black/20", strokeColor === color && tool === "brush" ? "outline outline-2 outline-offset-2 outline-slate-950" : "")} style={{ background: color }} />
            ))}
            <input aria-label="Brush color" type="color" value={strokeColor} onChange={(event) => { setStrokeColor(event.target.value); setTool("brush"); }} className="size-7 rounded border-0 bg-transparent p-0" />
            <input aria-label="Brush size" type="range" min={1} max={9} value={strokeSize} onChange={(event) => setStrokeSize(Number(event.target.value))} />
            <button type="button" onClick={() => setTool("eraser")} className={cn("flex items-center gap-1 rounded-md px-2 py-1", tool === "eraser" ? "bg-white shadow-sm" : "hover:bg-white/60")}>
              <Eraser className="size-3.5" />
              Eraser
            </button>
            <button type="button" onClick={clearCurrentDoodle} className="rounded-md px-2 py-1 hover:bg-white/60">Clear</button>
          </div>
        ) : null}

        <div className="relative min-h-0 flex-1 overflow-auto p-8">
          {selectedLocked ? (
            <div className="grid h-full place-items-center text-center">
              <div>
                <LockKeyhole className="mx-auto size-10 text-slate-400" />
                <p className="mt-3 text-sm font-semibold">This note is locked.</p>
                <button type="button" onClick={() => setIsUnlocked(true)} className="mt-4 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">Use Face ID</button>
              </div>
            </div>
          ) : (
            <div className="relative mx-auto min-h-full max-w-2xl">
              <div
                ref={editorRef}
                contentEditable={canEdit}
                suppressContentEditableWarning
                data-selectable
                onClick={handleEditorClick}
                onKeyDown={handleEditorKeyDown}
                onInput={() => persistEditorBody()}
                className="notes-editor selectable min-h-[520px] whitespace-pre-wrap rounded-md px-1 py-2 text-[17px] leading-8 text-slate-800 outline-none"
              />
              {selectedDoodle && !selectedLocked ? (
                // Doodles belong to the note canvas layer and should stay visible while reading.
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 z-[9] h-full min-h-[520px] w-full select-none"
                  style={{ backgroundImage: `url(${selectedDoodle})`, backgroundSize: "100% 100%" }}
                />
              ) : null}
              {drawingOpen && canEdit ? (
                <canvas
                  ref={canvasRef}
                  onPointerDown={startDrawing}
                  onPointerMove={draw}
                  onPointerUp={stopDrawing}
                  onPointerCancel={() => { lastPoint.current = null; }}
                  className="absolute inset-0 z-10 h-full min-h-[520px] w-full touch-none cursor-crosshair"
                />
              ) : null}
            </div>
          )}
        </div>

        {deleteNotice ? (
          <div className="absolute inset-0 z-20 grid place-items-center bg-black/20 backdrop-blur-sm">
            <div className="w-[320px] rounded-2xl bg-white p-5 text-center shadow-2xl">
              <h2 className="text-base font-semibold">{notesContent.deleteModal.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{selected.readonly ? "This authored note is read-only." : notesContent.deleteModal.body}</p>
              <button type="button" onClick={() => setDeleteNotice(false)} className="mt-5 rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white">OK</button>
            </div>
          </div>
        ) : null}
      </article>
    </div>
  );
}

function ToolbarButton({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={onClick} className="grid size-8 place-items-center rounded-md hover:bg-black/10 disabled:cursor-not-allowed disabled:opacity-35">
      {children}
    </button>
  );
}
