import fs from 'fs';
import Groq from 'groq-sdk';

export async function transcribeWithGroq(audioPath: string, language?: string) {
    const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY,
    });

    try {
        const options: any = {
            file: fs.createReadStream(audioPath),
            model: 'whisper-large-v3',
            response_format: 'verbose_json',
            temperature: 0.0,
            prompt: "The audio is a clear recording. Do not make up words, do not repeat yourself, and stop generating if there is nothing more to say.",
        };
        
        if (language && language !== 'auto') {
            options.language = language;
        }

        const result = await groq.audio.transcriptions.create(options);

        const segments = ((result as any).segments || []).map((seg: any) => ({
            start: seg.start,
            end: seg.end,
            text: seg.text
        }));

        return {
            text: result.text,
            segments: segments
        };
    } catch (error: any) {
        console.error("Groq Whisper error:", error);
        throw new Error(`Groq Transcription failed: ${error.message}`);
    }
}
