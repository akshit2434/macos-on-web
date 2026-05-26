import type { FinderFileRecord } from "@/content/apps/files";
import { cn } from "@/lib/utils";
import { FinderFileIcon } from "./FinderFileIcon";
import type { FinderView } from "./finder-types";

export function FinderFileList({
  files,
  selectedFile,
  locallyTaggedFileIds,
  view,
  onSelect,
}: {
  files: FinderFileRecord[];
  selectedFile: FinderFileRecord | null;
  locallyTaggedFileIds: string[];
  view: FinderView;
  onSelect: (file: FinderFileRecord) => void;
}) {
  if (view === "list") {
    return (
      <div className="overflow-hidden rounded-lg bg-white/80 ring-1 ring-black/5">
        <div className="grid grid-cols-[minmax(180px,1fr)_90px_90px_120px] border-b border-black/5 px-3 py-1.5 text-[11px] font-medium text-slate-500">
          <span>Name</span>
          <span>Kind</span>
          <span>Size</span>
          <span>Modified</span>
        </div>
        {files.map((file) => (
          <button
            key={file.id}
            type="button"
            onClick={() => onSelect(file)}
            className={cn(
              "grid w-full grid-cols-[minmax(180px,1fr)_90px_90px_120px] items-center gap-3 px-3 py-2 text-left text-sm",
              selectedFile?.id === file.id ? "bg-[#d8ebff]" : "hover:bg-black/5",
            )}
          >
            <span className="flex min-w-0 items-center gap-2">
              <FinderFileIcon kind={file.kind} />
              <span className="truncate font-medium">{file.name}</span>
              <LocalTagIndicator active={locallyTaggedFileIds.includes(file.id)} />
            </span>
            <span className="text-xs text-slate-500">{file.kind}</span>
            <span className="text-xs text-slate-500">{file.size}</span>
            <span className="truncate text-xs text-slate-500">{file.modifiedAt}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(118px,1fr))] gap-4">
      {files.map((file) => (
        <button
          key={file.id}
          type="button"
          onClick={() => onSelect(file)}
          className={cn(
            "rounded-lg p-3 text-center",
            selectedFile?.id === file.id ? "bg-[#d8ebff] ring-2 ring-[#4aa3ff]" : "hover:bg-black/5",
          )}
        >
          <FinderFileIcon kind={file.kind} large />
          <p className="mt-2 truncate text-[13px] font-medium">{file.name}</p>
          <p className="flex items-center justify-center gap-1 text-xs text-slate-500">
            <LocalTagIndicator active={locallyTaggedFileIds.includes(file.id)} />
            {file.kind}
          </p>
        </button>
      ))}
    </div>
  );
}

export function EmptySearchState({ query }: { query: string }) {
  return (
    <div className="grid min-h-[260px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-white/55 text-center text-sm text-slate-500">
      No files match &quot;{query}&quot;.
    </div>
  );
}

function LocalTagIndicator({ active }: { active: boolean }) {
  return active ? <span aria-label="Local tag" className="size-2 rounded-full bg-sky-500" /> : null;
}
