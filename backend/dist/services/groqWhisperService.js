"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transcribeWithGroq = transcribeWithGroq;
const fs_1 = __importDefault(require("fs"));
const groq_sdk_1 = __importDefault(require("groq-sdk"));
async function transcribeWithGroq(audioPath, language) {
    const groq = new groq_sdk_1.default({
        apiKey: process.env.GROQ_API_KEY,
    });
    try {
        const options = {
            file: fs_1.default.createReadStream(audioPath),
            model: 'whisper-large-v3',
            response_format: 'verbose_json',
            temperature: 0.0,
            prompt: "The audio is a clear recording. Do not make up words, do not repeat yourself, and stop generating if there is nothing more to say.",
        };
        if (language && language !== 'auto') {
            options.language = language;
        }
        const result = await groq.audio.transcriptions.create(options);
        const segments = (result.segments || []).map((seg) => ({
            start: seg.start,
            end: seg.end,
            text: seg.text
        }));
        return {
            text: result.text,
            segments: segments
        };
    }
    catch (error) {
        console.error("Groq Whisper error:", error);
        throw new Error(`Groq Transcription failed: ${error.message}`);
    }
}
