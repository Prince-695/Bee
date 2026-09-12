import { useState, useMemo } from "react";
import {
  Check,
  Columns,
  Copy,
  FileCode,
  List,
} from "lucide-react";

interface DiffLine {
  type: "add" | "del" | "normal" | "header";
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
}

interface ParsedDiffFile {
  filename: string;
  additions: number;
  deletions: number;
  lines: DiffLine[];
}

interface CodeDiffInspectorProps {
  diffText?: string;
  filename?: string;
}

function parseRawDiff(rawText: string): ParsedDiffFile[] {
  if (!rawText || !rawText.trim()) return [];

  const files: ParsedDiffFile[] = [];
  const rawLines = rawText.split("\n");

  let currentFile: ParsedDiffFile | null = null;
  let oldLine = 1;
  let newLine = 1;

  for (const line of rawLines) {
    if (line.startsWith("diff --git") || line.startsWith("--- a/")) {
      const match = line.match(/b\/(.*)$/);
      const name = match ? match[1] : "modified_file.ts";
      currentFile = {
        filename: name,
        additions: 0,
        deletions: 0,
        lines: [],
      };
      files.push(currentFile);
      oldLine = 1;
      newLine = 1;
      continue;
    }

    if (line.startsWith("@@")) {
      const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (match) {
        oldLine = parseInt(match[1], 10);
        newLine = parseInt(match[2], 10);
      }
      if (currentFile) {
        currentFile.lines.push({ type: "header", content: line });
      }
      continue;
    }

    if (!currentFile) {
      currentFile = {
        filename: "changes.diff",
        additions: 0,
        deletions: 0,
        lines: [],
      };
      files.push(currentFile);
    }

    if (line.startsWith("+") && !line.startsWith("+++")) {
      currentFile.additions++;
      currentFile.lines.push({
        type: "add",
        newLineNumber: newLine++,
        content: line.slice(1),
      });
    } else if (line.startsWith("-") && !line.startsWith("---")) {
      currentFile.deletions++;
      currentFile.lines.push({
        type: "del",
        oldLineNumber: oldLine++,
        content: line.slice(1),
      });
    } else {
      currentFile.lines.push({
        type: "normal",
        oldLineNumber: oldLine++,
        newLineNumber: newLine++,
        content: line.startsWith(" ") ? line.slice(1) : line,
      });
    }
  }

  return files;
}

export function CodeDiffInspector({
  diffText = "",
  filename = "solution.patch",
}: CodeDiffInspectorProps) {
  const [viewMode, setViewMode] = useState<"unified" | "split">("unified");
  const [copied, setCopied] = useState(false);

  // Sample fallback diff if none provided
  const effectiveDiff =
    diffText.trim() ||
    `--- a/src/auth/jwt_handler.py\n+++ b/src/auth/jwt_handler.py\n@@ -14,6 +14,9 @@\n def verify_token(token: str) -> dict:\n     try:\n-        payload = jwt.decode(token, SECRET, algorithms=["HS256"])\n+        # Zero-Trust Rotation & Leeway verification\n+        payload = jwt.decode(token, SECRET, algorithms=["HS256"], leeway=10)\n+        record_token_audit(payload.get("sub"))\n         return payload\n     except jwt.ExpiredSignatureError:\n         raise HTTPException(status_code=401, detail="Token expired")`;

  const parsedFiles = useMemo(
    () => parseRawDiff(effectiveDiff),
    [effectiveDiff]
  );

  const handleCopy = () => {
    void navigator.clipboard.writeText(effectiveDiff);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-border/70 skeuo-glass-card">
      {/* Diff Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-card/60 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <FileCode className="size-3.5" />
          </div>
          <span className="font-mono text-xs font-semibold text-foreground truncate max-w-[200px] sm:max-w-xs">
            {parsedFiles[0]?.filename || filename}
          </span>
          <div className="flex items-center gap-1.5 ml-1 font-mono text-[10px]">
            <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-500 font-bold border border-emerald-500/20">
              +{parsedFiles[0]?.additions || 0}
            </span>
            <span className="px-1.5 py-0.2 rounded bg-destructive/15 text-destructive font-bold border border-destructive/20">
              -{parsedFiles[0]?.deletions || 0}
            </span>
          </div>
        </div>

        {/* Tactile View Mode & Copy Controls */}
        <div className="flex items-center gap-1.5">
          <div className="flex rounded-lg border border-border/60 p-0.5 bg-muted/40">
            <button
              type="button"
              onClick={() => setViewMode("unified")}
              className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === "unified"
                  ? "bg-primary text-primary-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="size-3" />
              <span>Unified</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={`px-2 py-1 rounded text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                viewMode === "split"
                  ? "bg-primary text-primary-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Columns className="size-3" />
              <span>Split</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="skeuo-button-secondary size-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
            title="Copy diff to clipboard"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-500" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Diff Content Viewport */}
      <div className="skeuo-inset-terminal overflow-x-auto max-h-80 text-xs font-mono select-text">
        {parsedFiles.map((file, fileIdx) => (
          <div key={fileIdx} className="divide-y divide-white/5">
            {viewMode === "unified" ? (
              <table className="w-full text-left border-collapse">
                <tbody>
                  {file.lines.map((l, lineIdx) => {
                    if (l.type === "header") {
                      return (
                        <tr
                          key={lineIdx}
                          className="bg-primary/5 text-primary/80 font-mono text-[11px]"
                        >
                          <td
                            colSpan={3}
                            className="px-3 py-1 text-muted-foreground"
                          >
                            {l.content}
                          </td>
                        </tr>
                      );
                    }

                    const isAdd = l.type === "add";
                    const isDel = l.type === "del";

                    return (
                      <tr
                        key={lineIdx}
                        className={`transition-colors ${
                          isAdd
                            ? "bg-emerald-950/40 text-emerald-200"
                            : isDel
                            ? "bg-rose-950/40 text-rose-200"
                            : "hover:bg-white/[0.02] text-zinc-300"
                        }`}
                      >
                        {/* Old Line # */}
                        <td className="w-10 px-2 py-0.5 text-[10px] text-right text-zinc-600 select-none border-r border-white/5 font-mono">
                          {l.oldLineNumber || ""}
                        </td>
                        {/* New Line # */}
                        <td className="w-10 px-2 py-0.5 text-[10px] text-right text-zinc-600 select-none border-r border-white/5 font-mono">
                          {l.newLineNumber || ""}
                        </td>
                        {/* Code Line */}
                        <td className="px-3 py-0.5 whitespace-pre font-mono flex items-center gap-1.5">
                          <span className="w-3 select-none font-bold">
                            {isAdd ? "+" : isDel ? "-" : " "}
                          </span>
                          <span>{l.content}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              /* Split View Mode */
              <div className="grid grid-cols-2 divide-x divide-white/10 text-[11px]">
                {/* Left: Original */}
                <div className="overflow-x-auto p-2 space-y-0.5">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase pb-1 border-b border-white/5">
                    Original
                  </div>
                  {file.lines
                    .filter((l) => l.type !== "add" && l.type !== "header")
                    .map((l, i) => (
                      <div
                        key={i}
                        className={`px-2 py-0.5 flex gap-2 ${
                          l.type === "del"
                            ? "bg-rose-950/40 text-rose-200"
                            : "text-zinc-400"
                        }`}
                      >
                        <span className="w-6 text-right text-zinc-600 select-none text-[10px]">
                          {l.oldLineNumber}
                        </span>
                        <span className="whitespace-pre">{l.content}</span>
                      </div>
                    ))}
                </div>

                {/* Right: Modified */}
                <div className="overflow-x-auto p-2 space-y-0.5">
                  <div className="text-[10px] font-mono text-emerald-400 uppercase pb-1 border-b border-white/5">
                    Modified
                  </div>
                  {file.lines
                    .filter((l) => l.type !== "del" && l.type !== "header")
                    .map((l, i) => (
                      <div
                        key={i}
                        className={`px-2 py-0.5 flex gap-2 ${
                          l.type === "add"
                            ? "bg-emerald-950/40 text-emerald-200 font-medium"
                            : "text-zinc-400"
                        }`}
                      >
                        <span className="w-6 text-right text-zinc-600 select-none text-[10px]">
                          {l.newLineNumber}
                        </span>
                        <span className="whitespace-pre">{l.content}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
