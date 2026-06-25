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
1. Detect the language of the 'text'.
2. If the 'text' is NOT in English, translate it to English and return the translation in a new 'translation' field.
3. If the 'text' is ALREADY in English, set the 'translation' field to null. DO NOT translate it.
4. Do NOT combine or split segments. Return EXACTLY the same number of segments with the exact same 'start', 'end', and 'text' fields.
5. Add the 'translation' field to each segment.
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
                return parsed.segments.map((seg) => {
                    // Only append if there's a translation and it's not identical to the original text
                    if (seg.translation && typeof seg.translation === 'string' && seg.translation.trim().length > 0 && seg.translation.trim().toLowerCase() !== seg.text.trim().toLowerCase()) {
                        return {
                            ...seg,
                            text: `${seg.text}\n(${seg.translation.trim()})`
                        };
                    }
                    return {
                        start: seg.start,
                        end: seg.end,
                        text: seg.text
                    };
                });
            }
        }
    }
    catch (error) {
        console.error("Groq Segments Enhancement error:", error);
    }
    return segments;
}
