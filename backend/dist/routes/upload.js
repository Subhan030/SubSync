"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const audioService_1 = require("../services/audioService");
const transcriptionRouter_1 = require("../services/transcriptionRouter");
const srtService_1 = require("../services/srtService");
const enhancementService_1 = require("../services/enhancementService");
const fileUtils_1 = require("../utils/fileUtils");
const supabaseService_1 = require("../services/supabaseService");
const os_1 = __importDefault(require("os"));
const router = (0, express_1.Router)();
const UPLOAD_DIR = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'subsync-uploads-'));
const OUTPUT_DIR = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'subsync-outputs-'));
const upload = (0, multer_1.default)({ dest: UPLOAD_DIR });
router.post('/', upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        const model = req.body.model || 'whisper-small';
        const language = req.body.language;
        if (!file) {
            return res.status(400).json({ detail: 'No file uploaded' });
        }
        // Save temporary file
        const originalName = file.originalname;
        const filePath = (0, fileUtils_1.saveUploadFile)(file.path, originalName, UPLOAD_DIR);
        let targetAudioPath = filePath;
        const baseName = path_1.default.parse(originalName).name;
        const isLocalModel = model.includes('whisper-small') || model.includes('whisper-medium') || model.includes('whisper-tiny') || model.includes('whisper-base');
        const format = isLocalModel ? 'wav' : 'mp3';
        const audioPath = path_1.default.join(OUTPUT_DIR, `${baseName}.${format}`);
        // Extract and compress audio
        targetAudioPath = await (0, audioService_1.extractAudio)(filePath, audioPath, format);
        const stats = fs_1.default.statSync(targetAudioPath);
        if (stats.size > 25 * 1024 * 1024 && !isLocalModel) {
            throw new Error(`Audio is too large (${(stats.size / 1024 / 1024).toFixed(1)}MB) even after compression. Max limit is 25MB. Try a shorter video or use the local Whisper models.`);
        }
        // Transcribe audio using selected model
        const transcriptionResult = await (0, transcriptionRouter_1.routeTranscription)(targetAudioPath, model, language);
        const srtPath = path_1.default.join(OUTPUT_DIR, `${baseName}.srt`);
        // Translate non-English segments for dual-subtitles
        transcriptionResult.segments = await (0, enhancementService_1.enhanceSegments)(transcriptionResult.segments);
        (0, srtService_1.generateSrt)(transcriptionResult.segments, srtPath);
        // Enhance transcription text
        const enhancedText = await (0, enhancementService_1.enhanceTranscript)(transcriptionResult.text);
        let publicVideoUrl = null;
        let publicSrtUrl = null;
        let transcriptId = null;
        // Upload artifacts to Supabase
        if (process.env.SUPABASE_URL && process.env.SUPABASE_URL !== 'your_supabase_url') {
            try {
                const remoteVideoPath = `${Date.now()}_${originalName}`;
                publicVideoUrl = await (0, supabaseService_1.uploadFileToSupabase)(filePath, 'subsync-files', remoteVideoPath);
                const remoteSrtPath = `${Date.now()}_${baseName}.srt`;
                publicSrtUrl = await (0, supabaseService_1.uploadFileToSupabase)(srtPath, 'subsync-files', remoteSrtPath);
                transcriptId = await (0, supabaseService_1.saveTranscript)({
                    original_text: transcriptionResult.text,
                    enhanced_text: enhancedText,
                    segments: transcriptionResult.segments,
                    cloud_video_url: publicVideoUrl,
                    cloud_srt_url: publicSrtUrl
                });
                if (fs_1.default.existsSync(filePath))
                    fs_1.default.unlinkSync(filePath);
                if (fs_1.default.existsSync(targetAudioPath))
                    fs_1.default.unlinkSync(targetAudioPath);
                if (fs_1.default.existsSync(srtPath))
                    fs_1.default.unlinkSync(srtPath);
            }
            catch (err) {
                console.error("Failed to upload to Supabase, but transcription succeeded:", err);
            }
        }
        return res.json({
            status: 'success',
            message: 'File processed successfully',
            data: {
                transcript_id: transcriptId,
                original_text: transcriptionResult.text,
                segments: transcriptionResult.segments,
                enhanced_text: enhancedText,
                srt_path: srtPath,
                cloud_video_url: publicVideoUrl,
                cloud_srt_url: publicSrtUrl
            }
        });
    }
    catch (error) {
        console.error('Processing failed:', error);
        return res.status(500).json({ detail: `Processing failed: ${error.message}` });
    }
});
exports.default = router;
