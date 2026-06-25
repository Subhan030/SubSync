"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transcribeWithAssemblyAI = transcribeWithAssemblyAI;
const assemblyai_1 = require("assemblyai");
async function transcribeWithAssemblyAI(audioPath, language) {
    if (!process.env.ASSEMBLYAI_API_KEY || process.env.ASSEMBLYAI_API_KEY === 'your_assemblyai_api_key_here') {
        throw new Error('AssemblyAI API Key is missing. Please add it to your .env file.');
    }
    const client = new assemblyai_1.AssemblyAI({
        apiKey: process.env.ASSEMBLYAI_API_KEY,
    });
    try {
        const options = {
            audio: audioPath,
        };
        if (language && language !== 'auto') {
            options.language_code = language;
        }
        else {
            options.language_detection = true;
        }
        const transcript = await client.transcripts.transcribe(options);
        if (transcript.status === 'error') {
            throw new Error(transcript.error);
        }
        const segments = (transcript.utterances || []).map((u) => ({
            start: u.start / 1000,
            end: u.end / 1000,
            text: u.text
        }));
        if (segments.length === 0) {
            const words = transcript.words || [];
            let currentSegment = null;
            for (const word of words) {
                if (!currentSegment) {
                    currentSegment = { start: word.start / 1000, end: word.end / 1000, text: word.text };
                }
                else if (word.start / 1000 - currentSegment.start < 5) {
                    currentSegment.end = word.end / 1000;
                    currentSegment.text += ' ' + word.text;
                }
                else {
                    segments.push(currentSegment);
                    currentSegment = { start: word.start / 1000, end: word.end / 1000, text: word.text };
                }
            }
            if (currentSegment)
                segments.push(currentSegment);
        }
        return {
            text: transcript.text,
            segments
        };
    }
    catch (error) {
        console.error("AssemblyAI error:", error);
        throw new Error(`AssemblyAI Transcription failed: ${error.message}`);
    }
}
