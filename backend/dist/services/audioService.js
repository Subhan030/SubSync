"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractAudio = extractAudio;
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const ffmpeg_static_1 = __importDefault(require("ffmpeg-static"));
const fs_1 = __importDefault(require("fs"));
if (ffmpeg_static_1.default) {
    fluent_ffmpeg_1.default.setFfmpegPath(ffmpeg_static_1.default);
}
function extractAudio(videoPath, outputAudioPath, format = 'wav') {
    return new Promise((resolve, reject) => {
        if (fs_1.default.existsSync(outputAudioPath)) {
            fs_1.default.unlinkSync(outputAudioPath);
        }
        const command = (0, fluent_ffmpeg_1.default)(videoPath).output(outputAudioPath).audioChannels(1).audioFrequency(16000);
        if (format === 'wav') {
            command.audioCodec('pcm_s16le');
        }
        else {
            command.audioCodec('libmp3lame').audioBitrate('64k');
        }
        command
            .on('end', () => resolve(outputAudioPath))
            .on('error', (err) => reject(new Error(`FFmpeg failed to extract audio: ${err.message}`)))
            .run();
    });
}
