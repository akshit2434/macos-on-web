import { FileAudio, FileImage, FileText } from "lucide-react";

import type { FinderFileKind } from "@/content/apps/files";

export function FinderFileIcon({ kind, large = false }: { kind: FinderFileKind; large?: boolean }) {
  const className = large ? "mx-auto size-12" : "size-4";
  if (kind === "Image") return <FileImage className={`${className} text-fuchsia-500`} />;
  if (kind === "Audio") return <FileAudio className={`${className} text-emerald-500`} />;
  if (kind === "Note") return <FileText className={`${className} text-yellow-600`} />;
  return <FileText className={`${className} text-red-500`} />;
}
