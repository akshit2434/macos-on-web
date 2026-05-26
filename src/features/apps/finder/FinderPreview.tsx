import { FileAudio, LockKeyhole } from "lucide-react";
import Image from "next/image";

import type { FinderFileRecord } from "@/content/apps/files";
import { FinderFileIcon } from "./FinderFileIcon";

export function FinderPreview({ file, locked }: { file: FinderFileRecord | null; locked: boolean }) {
  return (
    <aside className="min-h-0 overflow-auto border-l border-black/10 bg-[#f3f3f5] p-4">
      <h2 className="text-sm font-semibold">Preview</h2>
      {locked ? (
        <div className="mt-4 rounded-xl bg-white p-5 text-center shadow-sm ring-1 ring-black/5">
          <LockKeyhole className="mx-auto size-9 text-slate-400" />
          <p className="mt-3 text-sm font-semibold">Preview locked.</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">This folder is present, but its files are not revealed in the current build.</p>
        </div>
      ) : null}
      {!locked && file ? (
        <div className="mt-4 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
          <PreviewHero file={file} />
          <div className="space-y-4 p-4">
            <div>
              <p className="truncate font-semibold">{file.name}</p>
              <p className="text-sm text-slate-500">{file.kind} - {file.size}</p>
            </div>
            <MetadataGrid file={file} />
            {file.tags?.length ? (
              <div className="flex flex-wrap gap-1.5">
                {file.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">{tag}</span>
                ))}
              </div>
            ) : null}
            <pre className="selectable max-h-48 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-700 ring-1 ring-black/5">
              {file.preview}
            </pre>
          </div>
        </div>
      ) : null}
      {!locked && !file ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
          Select a file to preview it.
        </div>
      ) : null}
    </aside>
  );
}

export function LockedFolderState() {
  return (
    <div className="grid min-h-[320px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-white/55 text-center">
      <div>
        <LockKeyhole className="mx-auto size-10 text-slate-400" />
        <p className="mt-3 text-sm font-semibold">Hidden is locked.</p>
        <p className="mt-1 max-w-[280px] text-xs leading-5 text-slate-500">The folder stays visible in the sidebar, but its files are protected until the real unlock rule exists.</p>
      </div>
    </div>
  );
}

function PreviewHero({ file }: { file: FinderFileRecord }) {
  if (file.kind === "Image" && file.previewImage) {
    return (
      <div className="relative aspect-[4/3] bg-slate-200">
        <Image src={file.previewImage} alt={`Preview of ${file.name}`} fill className="object-cover" sizes="330px" unoptimized />
      </div>
    );
  }

  if (file.kind === "Audio") {
    return (
      <div className="flex aspect-[4/3] flex-col justify-end gap-4 bg-gradient-to-br from-emerald-200 to-slate-900 p-5 text-white">
        <FileAudio className="size-12" />
        <div className="flex h-16 items-end gap-1">
          {[18, 34, 22, 48, 30, 56, 24, 42, 28, 52, 20, 36].map((height, index) => (
            <span key={index} className="w-full rounded-full bg-white/75" style={{ height }} />
          ))}
        </div>
        <p className="text-xs font-medium text-white/80">{file.duration ?? "Audio preview"}</p>
      </div>
    );
  }

  if (file.kind === "PDF") {
    return (
      <div className="grid aspect-[4/3] place-items-center bg-slate-200 p-5">
        <div className="h-full w-[72%] rounded-sm bg-white p-5 shadow-lg ring-1 ring-black/10">
          <p className="border-b border-slate-200 pb-2 text-sm font-semibold">Sem Break Plan</p>
          <div className="mt-4 space-y-2">
            {[92, 78, 86, 54, 88, 70].map((width, index) => (
              <span key={index} className="block h-1.5 rounded-full bg-slate-300" style={{ width: `${width}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid aspect-[4/3] place-items-center bg-gradient-to-br from-yellow-50 to-slate-200">
      <FinderFileIcon kind={file.kind} large />
    </div>
  );
}

function MetadataGrid({ file }: { file: FinderFileRecord }) {
  const rows = [
    ["Created", file.createdAt],
    ["Modified", file.modifiedAt],
    ["Protected", file.protected ? "Yes" : "No"],
  ];

  return (
    <dl className="grid grid-cols-[80px_1fr] gap-x-3 gap-y-1 text-xs">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-slate-500">{label}</dt>
          <dd className="truncate text-slate-700">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
