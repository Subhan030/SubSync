import { useState, useCallback } from "react";
import {
  Upload,
  Mic,
  Video,
  Globe,
  ChevronDown,
  Sparkles,
  Languages,
  Clock,
  Wand2,
  Subtitles,
  RotateCcw,
} from "lucide-react";
import UploadBox from "../components/UploadBox";
import Recorder from "../components/Recorder";
import VideoRecorder from "../components/VideoRecorder";
import TranscriptViewer from "../components/TranscriptViewer";
import SummaryCard from "../components/SummaryCard";
import DownloadButton from "../components/DownloadButton";
import { transcribeFile, summarize } from "../services/api";
import type { AISummary } from "../services/api";

const LANGUAGES = [
  { code: "auto", label: "Auto-detect" },
  { code: "af", label: "Afrikaans" },
  { code: "sq", label: "Albanian" },
  { code: "am", label: "Amharic" },
  { code: "ar", label: "Arabic" },
  { code: "hy", label: "Armenian" },
  { code: "az", label: "Azerbaijani" },
  { code: "eu", label: "Basque" },
  { code: "be", label: "Belarusian" },
  { code: "bn", label: "Bengali" },
  { code: "bs", label: "Bosnian" },
  { code: "bg", label: "Bulgarian" },
  { code: "ca", label: "Catalan" },
  { code: "ceb", label: "Cebuano" },
  { code: "zh", label: "Chinese" },
  { code: "co", label: "Corsican" },
  { code: "hr", label: "Croatian" },
  { code: "cs", label: "Czech" },
  { code: "da", label: "Danish" },
  { code: "nl", label: "Dutch" },
  { code: "en", label: "English" },
  { code: "eo", label: "Esperanto" },
  { code: "et", label: "Estonian" },
  { code: "fi", label: "Finnish" },
  { code: "fr", label: "French" },
  { code: "fy", label: "Frisian" },
  { code: "gl", label: "Galician" },
  { code: "ka", label: "Georgian" },
  { code: "de", label: "German" },
  { code: "el", label: "Greek" },
  { code: "gu", label: "Gujarati" },
  { code: "ht", label: "Haitian Creole" },
  { code: "ha", label: "Hausa" },
  { code: "haw", label: "Hawaiian" },
  { code: "he", label: "Hebrew" },
  { code: "hi", label: "Hindi" },
  { code: "hmn", label: "Hmong" },
  { code: "hu", label: "Hungarian" },
  { code: "is", label: "Icelandic" },
  { code: "ig", label: "Igbo" },
  { code: "id", label: "Indonesian" },
  { code: "ga", label: "Irish" },
  { code: "it", label: "Italian" },
  { code: "ja", label: "Japanese" },
  { code: "jv", label: "Javanese" },
  { code: "kn", label: "Kannada" },
  { code: "kk", label: "Kazakh" },
  { code: "km", label: "Khmer" },
  { code: "rw", label: "Kinyarwanda" },
  { code: "ko", label: "Korean" },
  { code: "ku", label: "Kurdish" },
  { code: "ky", label: "Kyrgyz" },
  { code: "lo", label: "Lao" },
  { code: "la", label: "Latin" },
  { code: "lv", label: "Latvian" },
  { code: "lt", label: "Lithuanian" },
  { code: "lb", label: "Luxembourgish" },
  { code: "mk", label: "Macedonian" },
  { code: "mg", label: "Malagasy" },
  { code: "ms", label: "Malay" },
  { code: "ml", label: "Malayalam" },
  { code: "mt", label: "Maltese" },
  { code: "mi", label: "Maori" },
  { code: "mr", label: "Marathi" },
  { code: "mn", label: "Mongolian" },
  { code: "my", label: "Myanmar" },
  { code: "ne", label: "Nepali" },
  { code: "no", label: "Norwegian" },
  { code: "ny", label: "Nyanja" },
  { code: "or", label: "Odia" },
  { code: "ps", label: "Pashto" },
  { code: "fa", label: "Persian" },
  { code: "pl", label: "Polish" },
  { code: "pt", label: "Portuguese" },
  { code: "pa", label: "Punjabi" },
  { code: "ro", label: "Romanian" },
  { code: "ru", label: "Russian" },
  { code: "sm", label: "Samoan" },
  { code: "gd", label: "Scots Gaelic" },
  { code: "sr", label: "Serbian" },
  { code: "sn", label: "Shona" },
  { code: "sd", label: "Sindhi" },
  { code: "si", label: "Sinhala" },
  { code: "sk", label: "Slovak" },
  { code: "sl", label: "Slovenian" },
  { code: "so", label: "Somali" },
  { code: "st", label: "Sotho" },
  { code: "es", label: "Spanish" },
  { code: "su", label: "Sundanese" },
  { code: "sw", label: "Swahili" },
  { code: "sv", label: "Swedish" },
  { code: "tl", label: "Tagalog" },
  { code: "tg", label: "Tajik" },
  { code: "ta", label: "Tamil" },
  { code: "tt", label: "Tatar" },
  { code: "te", label: "Telugu" },
  { code: "th", label: "Thai" },
  { code: "tr", label: "Turkish" },
  { code: "tk", label: "Turkmen" },
  { code: "uk", label: "Ukrainian" },
  { code: "ur", label: "Urdu" },
  { code: "ug", label: "Uyghur" },
  { code: "uz", label: "Uzbek" },
  { code: "vi", label: "Vietnamese" },
  { code: "cy", label: "Welsh" },
  { code: "xh", label: "Xhosa" },
  { code: "yi", label: "Yiddish" },
  { code: "yo", label: "Yoruba" },
  { code: "zu", label: "Zulu" },
];

const MODELS = [
  { code: "whisper-groq", title: "Whisper Large v3", provider: "OpenAI", description: "Best accuracy, 99 languages", tag: "Recommended" },
  { code: "universal-1", title: "Universal-1", provider: "AssemblyAI", description: "English-optimised, speaker labels", tag: "Best for EN" },
  { code: "nova-2", title: "Nova-2", provider: "Deepgram", description: "Real-time capable, low latency" },
  { code: "chirp", title: "Chirp", provider: "Google", description: "128 languages, high noise tolerance" }
];

type AppState = "idle" | "processing" | "done" | "error";

function HeroWave() {
  const bars = 42;
  return (
    <div className="flex items-center justify-center gap-[3px] h-10">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className="rounded-full"
          style={{
            width: "3px",
            background: `oklch(0.65 0.22 ${270 + (i % 6) * 10} / ${0.15 + Math.abs(Math.sin((i / bars) * Math.PI * 2)) * 0.5})`,
            height: `${5 + Math.abs(Math.sin((i / bars) * Math.PI * 2.5)) * 22}px`,
          }}
        />
      ))}
    </div>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="w-full">
      <div className="flex justify-between mb-2">
        <span className="text-xs text-muted-foreground">Transcribing</span>
        <span className="font-mono text-xs text-accent">{pct}%</span>
      </div>
      <div className="h-1 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function Home() {
  const [tab, setTab] = useState<"upload" | "record" | "record-video">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [recordBlob, setRecordBlob] = useState<Blob | null>(null);
  const [recordSeconds, setRecordSeconds] = useState(0);
  
  const [language, setLanguage] = useState("auto");
  const [langOpen, setLangOpen] = useState(false);
  
  const [model, setModel] = useState("whisper-groq");
  const [modelOpen, setModelOpen] = useState(false);

  const [appState, setAppState] = useState<AppState>("idle");
  const [progress, setProgress] = useState(0);
  const [srt, setSrt] = useState("");
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const selectedLang = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];
  const selectedModel = MODELS.find((m) => m.code === model) ?? MODELS[0];

  const canGenerate =
    appState === "idle" &&
    (tab === "upload" ? !!file : recordBlob !== null && recordSeconds > 0);

  const handleRecording = useCallback((blob: Blob | null, secs: number) => {
    setRecordBlob(blob);
    setRecordSeconds(secs);
  }, []);

  const generate = async () => {
    const source: File | Blob | null =
      tab === "upload" ? file : recordBlob;
    if (!source) return;

    setAppState("processing");
    setProgress(0);
    setSrt("");
    setSummary(null);

    try {
      const raw = await transcribeFile(source, language, model, setProgress);
      setSrt(raw);
      const ai = await summarize(raw);
      setSummary(ai);
      setAppState("done");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Transcription failed");
      setAppState("error");
    }
  };

  const reset = () => {
    setAppState("idle");
    setFile(null);
    setRecordBlob(null);
    setRecordSeconds(0);
    setSrt("");
    setSummary(null);
    setProgress(0);
  };

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
      onClick={() => { setLangOpen(false); setModelOpen(false); }}
    >
      {/* Ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(124,111,247,0.18) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 80%, rgba(167,139,250,0.07) 0%, transparent 60%)",
        }}
      />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Subtitles className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight">SubSync</span>
          <span className="font-mono text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5 tracking-widest uppercase">
            AI
          </span>
        </div>
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <button 
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="hover:text-foreground transition-colors cursor-pointer"
          >
            Features
          </button>
          {appState === "done" && (
            <button
              onClick={reset}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" /> New file
            </button>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-8 pt-14 pb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card text-xs text-muted-foreground mb-8 font-mono tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          Multilingual · 99 languages · Real-time SRT export
        </div>
        <h1
          className="text-6xl md:text-7xl font-bold leading-[1.08] tracking-tight mb-6"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Every voice<br />
          <span className="italic" style={{ color: "var(--accent)" }}>deserves</span>{" "}
          perfect subtitles.
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed">
          Upload a file or record directly in your browser. SubSync transcribes speech in any language and exports a clean, timestamped SRT file — enhanced by AI.
        </p>
        <HeroWave />
      </section>

      {/* ── IDLE / PROCESSING state ── */}
      {appState !== "done" && (
        <section className="relative z-10 max-w-2xl mx-auto px-8 pb-20">
          <div
            className="rounded-2xl border border-border bg-card overflow-hidden"
            style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)" }}
          >
            {/* Tabs */}
            <div className="flex border-b border-border">
              {(["upload", "record", "record-video"] as const).map((t) => (
                <button
                  key={t}
                  disabled={appState === "processing"}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-4 text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                    tab === t
                      ? "text-foreground border-b-2 border-primary bg-muted/30"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "upload" ? <Upload className="w-4 h-4" /> : t === "record" ? <Mic className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                  {t === "upload" ? "Upload file" : t === "record" ? "Record audio" : "Record video"}
                </button>
              ))}
            </div>

            <div className="p-8">
              {/* Selectors */}
              <div className="mb-6 flex flex-wrap items-center gap-4">
                {/* Language */}
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">Language:</span>
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button
                      disabled={appState === "processing"}
                      onClick={() => { setLangOpen(!langOpen); setModelOpen(false); }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm text-foreground hover:border-primary/50 transition-colors disabled:opacity-50"
                    >
                      {selectedLang.label}
                      <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${langOpen ? "rotate-180" : ""}`} />
                    </button>
                    {langOpen && (
                      <div
                        className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-xl overflow-hidden min-w-[160px]"
                        style={{ boxShadow: "0 16px 40px rgba(0,0,0,0.6)" }}
                      >
                        <div className="max-h-56 overflow-y-auto py-1">
                          {LANGUAGES.map((l) => (
                            <button
                              key={l.code}
                              onClick={() => { setLanguage(l.code); setLangOpen(false); }}
                              className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-muted ${
                                l.code === language ? "text-accent font-medium" : "text-foreground"
                              }`}
                            >
                              {l.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rich Model Selector */}
                <div className="flex-1 min-w-[320px]">
                  <div className="relative w-full" onClick={(e) => e.stopPropagation()}>
                    {/* Trigger Button */}
                    <button
                      disabled={appState === "processing"}
                      onClick={() => { setModelOpen(!modelOpen); setLangOpen(false); }}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-card border border-border hover:border-primary/50 transition-all text-left disabled:opacity-50 group"
                      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}
                    >
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2.5">
                          <span className="text-sm font-semibold text-foreground">{selectedModel.title}</span>
                          <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">{selectedModel.provider}</span>
                          {selectedModel.tag && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded border border-primary/30 text-primary bg-primary/10">
                              {selectedModel.tag}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{selectedModel.description}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform group-hover:text-foreground ${modelOpen ? "rotate-180" : ""}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {modelOpen && (
                      <div
                        className="absolute top-full left-0 mt-2 z-50 w-[420px] max-w-[90vw] bg-card border border-border rounded-xl overflow-hidden"
                        style={{ boxShadow: "0 16px 40px rgba(0,0,0,0.6)" }}
                      >
                        <div className="max-h-[380px] overflow-y-auto py-2">
                          {MODELS.map((m) => (
                            <button
                              key={m.code}
                              onClick={() => { setModel(m.code); setModelOpen(false); }}
                              className={`w-full text-left px-4 py-3 transition-colors flex items-center justify-between hover:bg-white/5 border-b border-white/5 last:border-0 ${
                                m.code === model ? "bg-white/5" : ""
                              }`}
                            >
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2.5">
                                  <span className={`text-sm font-semibold ${m.code === model ? "text-foreground" : "text-foreground/90"}`}>
                                    {m.title}
                                  </span>
                                  <span className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
                                    {m.provider}
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {m.description}
                                </span>
                              </div>
                              {m.tag && (
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded border border-primary/30 text-primary bg-primary/10 flex-shrink-0 ml-4">
                                  {m.tag}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tab content */}
              {tab === "upload" ? (
                <UploadBox file={file} onFile={setFile} />
              ) : tab === "record" ? (
                <Recorder onRecording={handleRecording} />
              ) : (
                <VideoRecorder onRecording={handleRecording} />
              )}

              {/* Progress */}
              {appState === "processing" && (
                <div className="mt-6">
                  <ProgressBar pct={progress} />
                  {progress === 100 && (
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Generating AI summary…
                    </p>
                  )}
                </div>
              )}

              {/* Error */}
              {appState === "error" && (
                <p className="mt-4 text-sm text-destructive text-center">{errorMsg}</p>
              )}

              {/* CTA */}
              <button
                disabled={!canGenerate}
                onClick={generate}
                className="mt-6 w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-accent transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {appState === "processing" ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate SRT subtitles
                  </>
                )}
              </button>

              <p className="text-center text-xs text-muted-foreground mt-3">
                AI-enhanced · Speaker labels · Auto-punctuation
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── DONE state — results ── */}
      {appState === "done" && srt && (
        <section className="relative z-10 max-w-5xl mx-auto px-8 pb-24 space-y-6">
          <div className="flex items-center justify-between">
            <h2
              className="text-3xl font-bold"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Your subtitles are ready.
            </h2>
            <DownloadButton srt={srt} filename="subtitles.srt" />
          </div>

          <div className="grid md:grid-cols-[1fr_340px] gap-5 items-start">
            <TranscriptViewer srt={srt} />
            {summary && <SummaryCard summary={summary} />}
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={reset}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-card text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Transcribe another file
            </button>
          </div>
        </section>
      )}

      {/* Features */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-8 pb-20">
        <div className="text-center mb-10">
          <h2
            className="text-4xl font-bold mb-3"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Built for precision.
          </h2>
          <p className="text-muted-foreground text-sm">Three pillars that make SubSync different.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon: <Languages className="w-5 h-5 text-accent" />,
              title: "99 languages",
              desc: "From French to Hindi, Arabic to Japanese — automatic detection or manual selection. Accents, dialects, and code-switching handled gracefully.",
              tag: "Multilingual",
            },
            {
              icon: <Clock className="w-5 h-5 text-accent" />,
              title: "Frame-accurate timestamps",
              desc: "Subtitle segments aligned to the millisecond. Word-level timestamps available for finer control. Export-ready SRT on first pass.",
              tag: "Precision",
            },
            {
              icon: <Wand2 className="w-5 h-5 text-accent" />,
              title: "AI enhancement",
              desc: "Smart punctuation, speaker diarization, filler word removal, and readability scoring — applied automatically after transcription.",
              tag: "AI Layer",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-card p-6 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                  {f.icon}
                </div>
                <span className="font-mono text-[10px] text-muted-foreground border border-border rounded px-2 py-0.5 tracking-widest uppercase">
                  {f.tag}
                </span>
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border max-w-6xl mx-auto px-8 py-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/20 border border-primary/30 flex items-center justify-center">
            <Subtitles className="w-3 h-3 text-primary" />
          </div>
          <span className="text-sm text-muted-foreground">SubSync</span>
        </div>
        <p className="text-xs text-muted-foreground font-mono">Speech → SRT · powered by AI</p>
      </footer>
    </div>
  );
}
