import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface SRTBlock {
  index: number;
  timestamp: string;
  text: string;
}

function parseSRT(raw: string): SRTBlock[] {
  return raw
    .trim()
    .split(/\n\n+/)
    .map((block) => {
      const lines = block.trim().split("\n");
      return {
        index: parseInt(lines[0], 10),
        timestamp: lines[1] ?? "",
        text: lines.slice(2).join("\n"),
      };
    })
    .filter((b) => b.timestamp);
}

interface Props {
  srt: string;
}

export default function TranscriptViewer({ srt }: Props) {
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<"blocks" | "raw">("blocks");

  const blocks = parseSRT(srt);

  const copy = () => {
    navigator.clipboard.writeText(srt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/20">
        <div className="flex gap-1">
          {(["blocks", "raw"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                view === v
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {v === "blocks" ? "Segments" : "Raw SRT"}
            </button>
          ))}
        </div>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {/* Body */}
      <div className="overflow-y-auto" style={{ maxHeight: "340px" }}>
        {view === "blocks" ? (
          <div className="divide-y divide-border">
            {blocks.map((b) => (
              <div key={b.index} className="flex gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors">
                <span className="font-mono text-xs text-muted-foreground w-5 pt-0.5 flex-shrink-0 tabular-nums">
                  {b.index}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs text-accent mb-1">{b.timestamp}</p>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                    {b.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <pre
            className="p-5 text-sm leading-7 text-foreground"
            style={{ fontFamily: "'Geist Mono', monospace" }}
          >
            {srt.split("\n").map((line, i) => {
              const isTimestamp = line.includes("-->");
              const isIndex = /^\d+$/.test(line.trim());
              return (
                <span
                  key={i}
                  className={`block ${
                    isTimestamp ? "text-accent" : isIndex ? "text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {line || " "}
                </span>
              );
            })}
          </pre>
        )}
      </div>
    </div>
  );
}
