import fs from 'fs';
import { WaveFile } from 'wavefile';
import { pipeline } from '@xenova/transformers';

const transcribers: Record<string, any> = {};

export async function getWhisperModel(modelName: string) {
    if (!transcribers[modelName]) {
        console.log(`Loading local model: ${modelName}`);
        transcribers[modelName] = await pipeline('automatic-speech-recognition', modelName);
    }
    return transcribers[modelName];
}

export async function transcribeWithLocalWhisper(audioPath: string, modelSize: string = 'whisper-small', language?: string) {
    let modelName = 'Xenova/whisper-small';
    if (modelSize === 'whisper-tiny') modelName = 'Xenova/whisper-tiny';
    if (modelSize === 'whisper-base') modelName = 'Xenova/whisper-base';
    if (modelSize === 'whisper-medium') modelName = 'Xenova/whisper-medium';

    const model = await getWhisperModel(modelName);

    // Convert audio to 16kHz mono Float32
    const buffer = fs.readFileSync(audioPath);
    const wav = new WaveFile(buffer);
    wav.toBitDepth('32f');
    wav.toSampleRate(16000);
    
    let audioData = wav.getSamples();
    if (Array.isArray(audioData)) {
        if (audioData.length > 1) {
            const SCALING_FACTOR = Math.sqrt(2);
            for (let i = 0; i < audioData[0].length; ++i) {
                audioData[0][i] = SCALING_FACTOR * (audioData[0][i] + audioData[1][i]) / 2;
            }
        }
        audioData = audioData[0];
    }

    const options: any = {
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: true,
    };
    
    if (language && language !== 'auto') {
        options.language = language;
    }

    const result = await model(audioData, options);

    const segments = (result.chunks || []).map((chunk: any) => ({
        start: chunk.timestamp[0],
        end: chunk.timestamp[1] !== null ? chunk.timestamp[1] : chunk.timestamp[0] + 2,
        text: chunk.text
    }));

    return {
        text: result.text,
        segments: segments
    };
}
