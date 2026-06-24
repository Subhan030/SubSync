import { useEffect, useRef, useState } from "react";
import { Video, Square, FileVideo } from "lucide-react";

interface Props {
  onRecording: (blob: Blob | null, seconds: number) => void;
}

export default function VideoRecorder({ onRecording }: Props) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [done, setDone] = useState(false);
  const [streamActive, setStreamActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const secondsRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);

  const startPreview = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStreamActive(true);
    } catch {
      alert("Camera or microphone access denied. Please allow access in your browser.");
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    
    const mr = new MediaRecorder(streamRef.current, { mimeType: "video/webm" });
    chunksRef.current = [];
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      onRecording(blob, secondsRef.current);
      setDone(true);
      stopStream();
    };
    
    mr.start(200);
    mediaRef.current = mr;
    setRecording(true);
    setDone(false);
    setSeconds(0);
    secondsRef.current = 0;
    
    timerRef.current = setInterval(() => {
      setSeconds((s) => {
        const next = s + 1;
        secondsRef.current = next;
        return next;
      });
    }, 1000);
  };

  const stopStream = () => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
    }
    setStreamActive(false);
  }

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const reset = () => {
    setDone(false);
    setSeconds(0);
    secondsRef.current = 0;
    onRecording(null, 0);
    startPreview();
  };

  useEffect(() => {
    startPreview();
    return () => { 
        if (timerRef.current) clearInterval(timerRef.current); 
        stopStream();
    }; 
  }, []);

  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");

  return (
    <div className="flex flex-col items-center gap-5 py-2">
      {/* Video Preview */}
      <div className="relative w-full max-w-[400px] aspect-video bg-black rounded-2xl overflow-hidden border border-border shadow-lg">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`w-full h-full object-cover transform -scale-x-100 ${streamActive && !done ? "block" : "hidden"}`}
        />
        
        {!streamActive && !done && (
           <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
               Requesting camera access...
           </div>
        )}

        {done && !recording && (
           <div className="absolute inset-0 flex items-center justify-center bg-card">
               <div className="flex flex-col items-center gap-2">
                   <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                        <FileVideo className="w-6 h-6 text-accent" />
                   </div>
                   <span className="text-sm font-medium">Video recorded</span>
               </div>
           </div>
        )}

        {/* Recording Overlay */}
        {recording && (
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-sm font-medium text-white tabular-nums">
              {m}:{s}
            </span>
          </div>
        )}
      </div>

      {!done && (
          <button
            onClick={recording ? stopRecording : startRecording}
            disabled={!streamActive}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all disabled:opacity-50 ${
            recording
                ? "bg-destructive hover:bg-destructive/80"
                : "bg-primary hover:bg-accent"
            }`}
            style={{
            boxShadow: recording
                ? "0 0 0 8px rgba(224,68,104,0.15), 0 8px 24px rgba(224,68,104,0.4)"
                : streamActive ? "0 0 0 8px rgba(124,111,247,0.15), 0 8px 24px rgba(124,111,247,0.4)" : "none",
            }}
          >
            {recording ? (
            <Square className="w-6 h-6 text-white fill-white" />
            ) : (
            <Video className="w-6 h-6 text-white" />
            )}
          </button>
      )}

      <p className="text-sm text-muted-foreground">
        {recording ? "Recording — click to stop" : done ? "Ready to transcribe" : "Click to start recording"}
      </p>

      {done && !recording && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 border border-accent/20">
            <FileVideo className="w-4 h-4 text-accent" />
            <span className="text-sm text-accent font-medium font-mono">
              {m}:{s} recorded
            </span>
          </div>
          <button
            onClick={reset}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            Re-record
          </button>
        </div>
      )}
    </div>
  );
}
