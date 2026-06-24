import { useEffect, useRef, useState } from "react";
import { Mic, Square, FileAudio } from "lucide-react";

interface Props {
  onRecording: (blob: Blob | null, seconds: number) => void;
}

const BARS_COUNT = 36;

function WaveformBars({ active, data }: { active: boolean, data: number[] }) {
  return (
    <div className="flex items-center justify-center gap-[3px] h-10 w-full">
      {Array.from({ length: BARS_COUNT }).map((_, i) => {
        const val = data[i] || 0;
        const activeHeight = 4 + (val / 255) * 32;
        const inactiveHeight = 4 + Math.abs(Math.sin((i / BARS_COUNT) * Math.PI * 2)) * 14;

        return (
          <div
            key={i}
            className="rounded-full transition-all duration-75"
            style={{
              width: "3px",
              background: active
                ? `oklch(0.65 0.22 ${270 + (i % 6) * 10})`
                : "rgba(255,255,255,0.12)",
              height: `${active ? activeHeight : inactiveHeight}px`,
            }}
          />
        );
      })}
    </div>
  );
}

export default function Recorder({ onRecording }: Props) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [done, setDone] = useState(false);
  const [audioData, setAudioData] = useState<number[]>(new Array(BARS_COUNT).fill(0));

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const secondsRef = useRef(0);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        onRecording(blob, secondsRef.current);
        setDone(true);
      };
      
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 128;
      
      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateWaveform = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        
        const step = Math.max(1, Math.floor(bufferLength / BARS_COUNT));
        const newData = [];
        for (let i = 0; i < BARS_COUNT; i++) {
          let sum = 0;
          let count = 0;
          for (let j = 0; j < step; j++) {
            const idx = i * step + j;
            if (idx < bufferLength) {
                sum += dataArray[idx];
                count++;
            }
          }
          newData.push(count > 0 ? sum / count : 0);
        }
        
        setAudioData(newData);
        rafRef.current = requestAnimationFrame(updateWaveform);
      };
      updateWaveform();

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
    } catch {
      alert("Microphone access denied. Please allow microphone access in your browser.");
    }
  };

  const stop = () => {
    mediaRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
        analyserRef.current = null;
    }
    setAudioData(new Array(BARS_COUNT).fill(0));
  };

  const reset = () => {
    setDone(false);
    setSeconds(0);
    secondsRef.current = 0;
    onRecording(null, 0);
  };

  useEffect(() => {
      return () => { 
          if (timerRef.current) clearInterval(timerRef.current); 
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
      }; 
  }, []);

  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");

  return (
    <div className="flex flex-col items-center gap-5 py-4">
      <WaveformBars active={recording} data={audioData} />

      {recording && (
        <span className="font-mono text-2xl tracking-widest text-foreground tabular-nums">
          {m}:{s}
        </span>
      )}

      <button
        onClick={recording ? stop : start}
        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
          recording
            ? "bg-destructive hover:bg-destructive/80"
            : "bg-primary hover:bg-accent"
        }`}
        style={{
          boxShadow: recording
            ? "0 0 0 8px rgba(224,68,104,0.15), 0 8px 24px rgba(224,68,104,0.4)"
            : "0 0 0 8px rgba(124,111,247,0.15), 0 8px 24px rgba(124,111,247,0.4)",
        }}
      >
        {recording ? (
          <Square className="w-7 h-7 text-white fill-white" />
        ) : (
          <Mic className="w-7 h-7 text-white" />
        )}
      </button>

      <p className="text-sm text-muted-foreground">
        {recording ? "Recording — click to stop" : done ? "Ready to transcribe" : "Click to start recording"}
      </p>

      {done && !recording && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent/10 border border-accent/20">
            <FileAudio className="w-4 h-4 text-accent" />
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
