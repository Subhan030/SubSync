"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transcribeWithDeepgram = transcribeWithDeepgram;
const fs_1 = __importDefault(require("fs"));
const sdk_1 = require("@deepgram/sdk");
async function transcribeWithDeepgram(audioPath, language) {
    if (!process.env.DEEPGRAM_API_KEY || process.env.DEEPGRAM_API_KEY === 'your_deepgram_api_key_here') {
        throw new Error('Deepgram API Key is missing. Please add it to your .env file.');
    }
    const deepgram = (0, sdk_1.createClient)(process.env.DEEPGRAM_API_KEY);
    try {
        const audioBuffer = fs_1.default.readFileSync(audioPath);
        const options = {
            model: 'nova-2',
            smart_format: true,
            utterances: true,
            diarize: true,
        };
        if (language && language !== 'auto') {
            options.language = language;
        }
        const { result, error } = await deepgram.listen.prerecorded.transcribeFile(audioBuffer, options);
        if (error) {
            throw error;
        }
        const paragraphs = result?.results?.channels[0]?.alternatives[0]?.paragraphs?.paragraphs || [];
        const segments = paragraphs.map((p) => ({
            start: p.start,
            end: p.end,
            text: p.sentences.map((s) => s.text).join(' ')
        }));
        const text = result?.results?.channels[0]?.alternatives[0]?.transcript || '';
        if (segments.length === 0) {
            const words = result?.results?.channels[0]?.alternatives[0]?.words || [];
            let currentSegment = null;
            for (const word of words) {
                if (!currentSegment) {
                    currentSegment = { start: word.start, end: word.end, text: word.punctuated_word };
                }
                else if (word.start - currentSegment.start < 5) {
                    currentSegment.end = word.end;
                    currentSegment.text += ' ' + word.punctuated_word;
                }
                else {
                    segments.push(currentSegment);
                    currentSegment = { start: word.start, end: word.end, text: word.punctuated_word };
                }
            }
            if (currentSegment)
                segments.push(currentSegment);
        }
        return {
            text,
            segments
        };
    }
    catch (error) {
        console.error("Deepgram error:", error);
        throw new Error(`Deepgram Transcription failed: ${error.message}`);
    }
}
