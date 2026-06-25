"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeTranscription = routeTranscription;
const groqWhisperService_1 = require("./groqWhisperService");
const deepgramService_1 = require("./deepgramService");
const assemblyService_1 = require("./assemblyService");
const whisperService_1 = require("./whisperService");
const HALLUCINATIONS = [
    "thank you for watching",
    "thanks for watching",
    "subscribe to the channel",
    "subtitles by amara org",
    "please wear on earphones",
    "please do not transcribe ambient noise or silence",
    "the audio is a clear recording do not make up words do not repeat yourself and stop generating if there is nothing more to say"
];
function isHallucination(text) {
    if (!text || text.trim() === '')
        return true;
    const normalized = text.toLowerCase().replace(/[^a-z ]/g, '').trim();
    // If the original text had characters but normalized is empty, it's likely a foreign script (e.g. Hindi)
    if (!normalized && text.trim().length > 0)
        return false;
    if (!normalized)
        return true;
    return HALLUCINATIONS.some(h => normalized.includes(h) || normalized.includes("amara org"));
}
async function routeTranscription(audioPath, model, language) {
    let result;
    switch (model) {
        case 'whisper-groq':
        case 'whisper large v3':
            result = await (0, groqWhisperService_1.transcribeWithGroq)(audioPath, language);
            break;
        case 'nova-2':
        case 'nova 2':
        case 'deepgram':
            result = await (0, deepgramService_1.transcribeWithDeepgram)(audioPath, language);
            break;
        case 'universal-1':
        case 'universal 1':
        case 'assemblyai':
            result = await (0, assemblyService_1.transcribeWithAssemblyAI)(audioPath, language);
            break;
        case 'whisper-tiny':
        case 'whisper-base':
        case 'whisper-small':
        case 'whisper-medium':
        case 'whisper small':
        case 'whisper medium':
            let localModel = 'whisper-small';
            if (model.includes('tiny'))
                localModel = 'whisper-tiny';
            if (model.includes('base'))
                localModel = 'whisper-base';
            if (model.includes('medium'))
                localModel = 'whisper-medium';
            result = await (0, whisperService_1.transcribeWithLocalWhisper)(audioPath, localModel, language);
            break;
        default:
            console.warn(`Model ${model} not recognized, falling back to local whisper-small.`);
            result = await (0, whisperService_1.transcribeWithLocalWhisper)(audioPath, 'whisper-small', language);
            break;
    }
    if (result && result.text) {
        if (isHallucination(result.text)) {
            result.text = "No speech detected.";
            result.segments = [{ start: 0, end: 1, text: "No speech detected." }];
        }
    }
    return result;
}
