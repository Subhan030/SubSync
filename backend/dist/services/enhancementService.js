"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enhanceTranscript = enhanceTranscript;
exports.enhanceSegments = enhanceSegments;
const groq_sdk_1 = __importDefault(require("groq-sdk"));
async function enhanceTranscript(transcriptText) {
    if (!transcriptText || transcriptText.trim() === '')
        return '';
    const groq = new groq_sdk_1.default({
        apiKey: process.env.GROQ_API_KEY,
    });
    const systemPrompt = `You are an expert transcription editor. Your job is to clean up a raw transcript.
Please apply the following rules:
1. Remove all filler words (e.g., um, uh, ah).
2. Correct obvious grammar and punctuation mistakes.
3. Fix any likely transcription misspellings based on the context.
4. DO NOT change the overall meaning or tone of the text.
5. MUST KEEP the text in its original language and script (e.g., if it is Hindi Devanagari, keep it Hindi Devanagari). DO NOT translate it.
6. DO NOT add any conversational preamble or postscript (e.g., "Here is the corrected text:"). Output ONLY the final cleaned text.`;
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: transcriptText }
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.2,
        });
        return chatCompletion.choices[0]?.message?.content?.trim() || transcriptText.trim();
    }
    catch (error) {
        console.error("Groq Enhancement error:", error);
        return transcriptText.trim();
    }
}
async function enhanceSegments(segments) {
    if (!segments || segments.length === 0)
        return segments;
    const groq = new groq_sdk_1.default({
        apiKey: process.env.GROQ_API_KEY,
    });
    const systemPrompt = `You are a translation assistant. You will receive a JSON object containing an array of transcription 'segments'.
Each segment has 'start', 'end', and 'text' fields.
Your task:
1. For each segment, if the 'text' is NOT in English, translate it to English.
2. Append the English translation in brackets ON A NEW LINE below the original text. Example: "[Original Foreign Text]\\n([English Translation])"
3. If the 'text' is ALREADY in English, leave it exactly as it is (do NOT translate it to any other language).
4. Do NOT combine or split segments. Return EXACTLY the same number of segments with the exact same 'start' and 'end' times.
5. Return EXACTLY the same JSON array structure, just with the updated 'text' fields.
Output a JSON object with a single key 'segments' containing the updated array.`;
    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: JSON.stringify({ segments }) }
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.2,
            response_format: { type: 'json_object' }
        });
        const content = chatCompletion.choices[0]?.message?.content;
        if (content) {
            const parsed = JSON.parse(content);
            if (parsed.segments && Array.isArray(parsed.segments)) {
                return parsed.segments;
            }
        }
    }
    catch (error) {
        console.error("Groq Segments Enhancement error:", error);
    }
    return segments;
}
