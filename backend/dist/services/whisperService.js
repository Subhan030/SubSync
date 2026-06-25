"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWhisperModel = getWhisperModel;
exports.transcribeWithLocalWhisper = transcribeWithLocalWhisper;
const fs_1 = __importDefault(require("fs"));
const wavefile_1 = require("wavefile");
const transformers_1 = require("@xenova/transformers");
const transcribers = {};
async function getWhisperModel(modelName) {
    if (!transcribers[modelName]) {
        console.log(`Loading local model: ${modelName}`);
        transcribers[modelName] = await (0, transformers_1.pipeline)('automatic-speech-recognition', modelName);
    }
    return transcribers[modelName];
}
async function transcribeWithLocalWhisper(audioPath, modelSize = 'whisper-small', language) {
    let modelName = 'Xenova/whisper-small';
    if (modelSize === 'whisper-tiny')
        modelName = 'Xenova/whisper-tiny';
    if (modelSize === 'whisper-base')
        modelName = 'Xenova/whisper-base';
    if (modelSize === 'whisper-medium')
        modelName = 'Xenova/whisper-medium';
    const model = await getWhisperModel(modelName);
    // Convert audio to 16kHz mono Float32
    const buffer = fs_1.default.readFileSync(audioPath);
    const wav = new wavefile_1.WaveFile(buffer);
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
    const options = {
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: true,
    };
    if (language && language !== 'auto') {
        options.language = language;
    }
    const result = await model(audioData, options);
    const segments = (result.chunks || []).map((chunk) => ({
        start: chunk.timestamp[0],
        end: chunk.timestamp[1] !== null ? chunk.timestamp[1] : chunk.timestamp[0] + 2,
        text: chunk.text
    }));
    return {
        text: result.text,
        segments: segments
    };
}
