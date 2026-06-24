import { transcribeWithGroq } from './groqWhisperService';
import { transcribeWithDeepgram } from './deepgramService';
import { transcribeWithAssemblyAI } from './assemblyService';
import { transcribeWithLocalWhisper } from './whisperService';
const HALLUCINATIONS = [
    "thank you for watching",
    "thanks for watching",
    "subscribe to the channel",
    "subtitles by amara org",
    "please wear on earphones",
    "please do not transcribe ambient noise or silence",
    "the audio is a clear recording do not make up words do not repeat yourself and stop generating if there is nothing more to say"
];

function isHallucination(text: string) {
    if (!text || text.trim() === '') return true;
    const normalized = text.toLowerCase().replace(/[^a-z ]/g, '').trim();
    
    // If the original text had characters but normalized is empty, it's likely a foreign script (e.g. Hindi)
    if (!normalized && text.trim().length > 0) return false;
    if (!normalized) return true;

    return HALLUCINATIONS.some(h => normalized.includes(h) || normalized.includes("amara org"));
}


export async function routeTranscription(audioPath: string, model: string, language?: string) {
    let result: any;

    switch (model) {
        case 'whisper-groq':
        case 'whisper large v3':
            result = await transcribeWithGroq(audioPath, language);
            break;
        
        case 'nova-2':
        case 'nova 2':
        case 'deepgram':
            result = await transcribeWithDeepgram(audioPath, language);
            break;
            
        case 'universal-1':
        case 'universal 1':
        case 'assemblyai':
            result = await transcribeWithAssemblyAI(audioPath, language);
            break;
            
        case 'whisper-tiny':
        case 'whisper-base':
        case 'whisper-small':
        case 'whisper-medium':
        case 'whisper small':
        case 'whisper medium':
            let localModel = 'whisper-small';
            if (model.includes('tiny')) localModel = 'whisper-tiny';
            if (model.includes('base')) localModel = 'whisper-base';
            if (model.includes('medium')) localModel = 'whisper-medium';
            result = await transcribeWithLocalWhisper(audioPath, localModel, language);
            break;
            
        default:
            console.warn(`Model ${model} not recognized, falling back to local whisper-small.`);
            result = await transcribeWithLocalWhisper(audioPath, 'whisper-small', language);
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
