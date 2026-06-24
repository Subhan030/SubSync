import { useState } from "react";
import { Download, Check } from "lucide-react";
import { downloadSRT } from "../services/api";

interface Props {
  srt: string;
  filename?: string;
  className?: string;
}

export default function DownloadButton({ srt, filename = "subtitles.srt", className = "" }: Props) {
  const [flash, setFlash] = useState(false);

  const handle = () => {
    downloadSRT(srt, filename);
    setFlash(true);
    setTimeout(() => setFlash(false), 2000);
  };

  return (
    <button
      onClick={handle}
      className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
        flash
          ? "bg-accent/20 border border-accent/40 text-accent"
          : "bg-primary text-primary-foreground hover:bg-accent"
      } ${className}`}
    >
      {flash ? (
        <>
          <Check className="w-4 h-4" />
          Downloaded!
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          Download .srt
        </>
      )}
    </button>
  );
}
