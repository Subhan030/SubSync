/// <reference types="vite/client" />

/**
 * SubSync API service layer.
 * Swap mock implementations here for real fetch/axios calls once the
 * backend is wired up. Every function returns a Promise so callers never
 * need to change when the real endpoints land.
 */

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
// Strip trailing slashes so we don't end up with //api/upload
const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

const MOCK_SRT = `1
00:00:01,240 --> 00:00:04,180
Bienvenue dans notre présentation
sur l'intelligence artificielle.

2
00:00:04,620 --> 00:00:08,340
Aujourd'hui, nous allons explorer
comment les modèles de langage fonctionnent.

3
00:00:09,080 --> 00:00:13,200
Ces systèmes apprennent à partir
de vastes ensembles de données textuelles.

4
00:00:13,740 --> 00:00:17,560
Et peuvent générer du texte
cohérent et contextuel.

5
00:00:18,200 --> 00:00:22,880
Les applications sont nombreuses :
traduction, résumé, génération de code.

6
00:00:23,400 --> 00:00:27,120
Nous verrons également les limites
et les défis éthiques associés.`;

export interface AISummary {
  title: string;
  language: string;
  duration: string;
  segments: number;
  wordCount: number;
  keyPoints: string[];
  sentiment: string;
  confidence: number;
}

const MOCK_SUMMARY: AISummary = {
  title: "AI & Language Models — Introduction",
  language: "Français",
  duration: "0:27",
  segments: 6,
  wordCount: 68,
  keyPoints: [
    "Introduction to artificial intelligence and language models",
    "How large models learn from textual datasets",
    "Applications: translation, summarisation, code generation",
    "Ethical challenges and known limitations of AI systems",
  ],
  sentiment: "Informative",
  confidence: 0.97,
};

export async function transcribeFile(
  file: File | Blob,
  language: string,
  model: string,
  onProgress: (pct: number) => void,
): Promise<string> {
  // Simulate upload progress
  let progress = 0;
  const interval = setInterval(() => {
    progress += (90 - progress) * 0.1; 
    onProgress(Math.floor(progress));
  }, 500);

  try {
    const formData = new FormData();
    formData.append('file', file, file instanceof File ? file.name : 'recording.webm');
    formData.append('model', model);
    if (language !== 'auto') {
      formData.append('language', language);
    }

    const targetUrl = `${API_BASE_URL}/api/upload`;
    const response = await fetch(targetUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      if (response.status === 404) {
        throw new Error(`404 Not Found. The frontend tried to hit: ${targetUrl}. If this is wrong, your VITE_API_URL in Vercel is incorrect!`);
      }
      throw new Error(errData.detail || `Upload failed with status ${response.status}`);
    }

    const result = await response.json();
    
    clearInterval(interval);
    onProgress(100);

    // Construct SRT from returned segments
    if (result.data && result.data.segments) {
      return result.data.segments.map((seg: any, i: number) => {
        const formatSrtTime = (seconds: number) => {
          const totalMs = Math.round(seconds * 1000);
          const ms = totalMs % 1000;
          const totalSecs = Math.floor(totalMs / 1000);
          const s = totalSecs % 60;
          const m = Math.floor(totalSecs / 60) % 60;
          const h = Math.floor(totalSecs / 3600);
          
          const pad = (num: number, size: number) => num.toString().padStart(size, '0');
          return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)},${pad(ms, 3)}`;
        };
        return `${i + 1}\n${formatSrtTime(seg.start)} --> ${formatSrtTime(seg.end)}\n${seg.text.trim()}`;
      }).join('\n\n');
    }

    return MOCK_SRT;
  } catch (error) {
    clearInterval(interval);
    console.error("Transcription error:", error);
    throw error;
  }
}

/**
 * Generate an AI summary from raw SRT transcript text.
 */
export async function summarize(srtText: string): Promise<AISummary> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ srtText }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || `Summarize failed with status ${response.status}`);
    }

    const result = await response.json();
    return result.data as AISummary;
  } catch (error) {
    console.error("Summarization error:", error);
    throw error;
  }
}

/**
 * Trigger a browser download of the SRT content.
 */
export function downloadSRT(srtText: string, filename = "subtitles.srt"): void {
  const blob = new Blob([srtText], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
