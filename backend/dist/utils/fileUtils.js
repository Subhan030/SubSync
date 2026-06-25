"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileExtension = getFileExtension;
exports.isVideoFile = isVideoFile;
exports.isAudioFile = isAudioFile;
exports.saveUploadFile = saveUploadFile;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const VIDEO_EXTENSIONS = new Set(['.mp4', '.avi', '.mov', '.mkv', '.webm']);
const AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.m4a', '.flac', '.ogg']);
function getFileExtension(filename) {
    return path_1.default.extname(filename).toLowerCase();
}
function isVideoFile(filepath) {
    const ext = getFileExtension(filepath);
    return VIDEO_EXTENSIONS.has(ext);
}
function isAudioFile(filepath) {
    const ext = getFileExtension(filepath);
    return AUDIO_EXTENSIONS.has(ext);
}
function saveUploadFile(tempPath, filename, destinationFolder) {
    const filePath = path_1.default.join(destinationFolder, filename);
    fs_1.default.copyFileSync(tempPath, filePath);
    return filePath;
}
