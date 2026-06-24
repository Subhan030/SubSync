import { useRef, useCallback, useState } from "react";
import { Upload, FileVideo, FileAudio, X } from "lucide-react";

interface Props {
  file: File | null;
  onFile: (f: File | null) => void;
}

export default function UploadBox({ file, onFile }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) onFile(dropped);
    },
    [onFile],
  );

  const FileIcon =
    file?.type.startsWith("video/") ? FileVideo : FileAudio;

  return (
    <div
      className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer group ${
        dragOver
          ? "border-primary bg-primary/10"
          : file
          ? "border-accent/50 bg-accent/5"
          : "border-border hover:border-primary/40 hover:bg-muted/30"
      }`}
      style={{ minHeight: "220px" }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="audio/*,video/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8">
        {file ? (
          <>
            <div className="w-14 h-14 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center">
              <FileIcon className="w-5 h-5 text-accent" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {(file.size / 1024 / 1024).toFixed(1)} MB &middot; {file.type || "unknown type"}
              </p>
            </div>
            <button
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
              onClick={(e) => { e.stopPropagation(); onFile(null); }}
            >
              <X className="w-3 h-3" /> Remove file
            </button>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-xl bg-muted border border-border flex items-center justify-center group-hover:border-primary/40 transition-colors">
              <Upload className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Drop your file here
              </p>
              <p className="text-xs text-muted-foreground mt-1.5">
                MP4, MOV, MP3, WAV, M4A &middot; up to 500 MB
              </p>
            </div>
            <span className="text-xs text-muted-foreground/60">or click to browse</span>
          </>
        )}
      </div>
    </div>
  );
}
