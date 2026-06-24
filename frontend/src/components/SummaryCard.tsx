import { Wand2, Globe, Clock, Hash, AlignLeft, TrendingUp } from "lucide-react";
import type { AISummary } from "../services/api";

interface Props {
  summary: AISummary;
}

export default function SummaryCard({ summary }: Props) {
  const confidencePct = Math.round(summary.confidence * 100);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border bg-accent/5">
        <div className="w-7 h-7 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center">
          <Wand2 className="w-3.5 h-3.5 text-accent" />
        </div>
        <div>
          <p className="text-xs font-semibold text-foreground">AI Enhancement</p>
          <p className="text-[10px] text-muted-foreground font-mono">Summary · Key points · Metadata</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <div
            className="h-1.5 rounded-full bg-accent/30 overflow-hidden"
            style={{ width: "64px" }}
          >
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${confidencePct}%` }}
            />
          </div>
          <span className="font-mono text-[10px] text-accent">{confidencePct}%</span>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Title */}
        <div>
          <p className="text-xs text-muted-foreground mb-1">Detected title</p>
          <p className="text-sm font-semibold text-foreground">{summary.title}</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: <Globe className="w-3.5 h-3.5" />, label: "Language", value: summary.language },
            { icon: <Clock className="w-3.5 h-3.5" />, label: "Duration", value: summary.duration },
            { icon: <Hash className="w-3.5 h-3.5" />, label: "Segments", value: summary.segments },
            { icon: <AlignLeft className="w-3.5 h-3.5" />, label: "Words", value: summary.wordCount },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-secondary border border-border"
            >
              <span className="text-muted-foreground">{stat.icon}</span>
              <div>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                <p className="text-xs font-semibold text-foreground font-mono">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Key points */}
        <div>
          <p className="text-xs text-muted-foreground mb-2.5 flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" /> Key points
          </p>
          <ul className="space-y-2">
            {summary.keyPoints.map((pt, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="font-mono text-[10px] text-accent mt-0.5 w-4 flex-shrink-0 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-xs text-foreground leading-relaxed">{pt}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Sentiment */}
        <div className="flex items-center gap-2 pt-1 border-t border-border">
          <span className="text-xs text-muted-foreground">Tone:</span>
          <span className="px-2 py-0.5 rounded-full bg-primary/15 border border-primary/25 text-xs text-primary font-medium">
            {summary.sentiment}
          </span>
        </div>
      </div>
    </div>
  );
}
