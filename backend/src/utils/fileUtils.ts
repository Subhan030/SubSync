import path from 'path';
import fs from 'fs';

const VIDEO_EXTENSIONS = new Set(['.mp4', '.avi', '.mov', '.mkv', '.webm']);
const AUDIO_EXTENSIONS = new Set(['.mp3', '.wav', '.m4a', '.flac', '.ogg']);

export function getFileExtension(filename: string): string {
    return path.extname(filename).toLowerCase();
}

export function isVideoFile(filepath: string): boolean {
    const ext = getFileExtension(filepath);
    return VIDEO_EXTENSIONS.has(ext);
}

export function isAudioFile(filepath: string): boolean {
    const ext = getFileExtension(filepath);
    return AUDIO_EXTENSIONS.has(ext);
}

export function saveUploadFile(tempPath: string, filename: string, destinationFolder: string): string {
    const filePath = path.join(destinationFolder, filename);
    fs.copyFileSync(tempPath, filePath);
    return filePath;
}
