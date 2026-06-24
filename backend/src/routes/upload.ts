import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { extractAudio } from '../services/audioService';
import { routeTranscription } from '../services/transcriptionRouter';
import { generateSrt } from '../services/srtService';
import { enhanceTranscript, enhanceSegments } from '../services/enhancementService';
import { isVideoFile, saveUploadFile } from '../utils/fileUtils';
import { uploadFileToSupabase, saveTranscript } from '../services/supabaseService';

import os from 'os';

const router = Router();

const UPLOAD_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'subsync-uploads-'));
const OUTPUT_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'subsync-outputs-'));

const upload = multer({ dest: UPLOAD_DIR });

router.post('/', upload.single('file'), async (req: Request, res: Response): Promise<any> => {
    try {
        const file = req.file;
        const model = req.body.model || 'whisper-small';
        const language = req.body.language;

        if (!file) {
            return res.status(400).json({ detail: 'No file uploaded' });
        }

        // Save temporary file
        const originalName = file.originalname;
        const filePath = saveUploadFile(file.path, originalName, UPLOAD_DIR);
        
        let targetAudioPath = filePath;
        const baseName = path.parse(originalName).name;

        const isLocalModel = model.includes('whisper-small') || model.includes('whisper-medium') || model.includes('whisper-tiny') || model.includes('whisper-base');
        const format = isLocalModel ? 'wav' : 'mp3';
        const audioPath = path.join(OUTPUT_DIR, `${baseName}.${format}`);
        
        // Extract and compress audio
        targetAudioPath = await extractAudio(filePath, audioPath, format);

        const stats = fs.statSync(targetAudioPath);
        if (stats.size > 25 * 1024 * 1024 && !isLocalModel) {
            throw new Error(`Audio is too large (${(stats.size / 1024 / 1024).toFixed(1)}MB) even after compression. Max limit is 25MB. Try a shorter video or use the local Whisper models.`);
        }

        // Transcribe audio using selected model
        const transcriptionResult = await routeTranscription(targetAudioPath, model, language);

        const srtPath = path.join(OUTPUT_DIR, `${baseName}.srt`);
        
        // Translate non-English segments for dual-subtitles
        transcriptionResult.segments = await enhanceSegments(transcriptionResult.segments);
        
        generateSrt(transcriptionResult.segments, srtPath);

        // Enhance transcription text
        const enhancedText = await enhanceTranscript(transcriptionResult.text);

        let publicVideoUrl = null;
        let publicSrtUrl = null;
        let transcriptId = null;
        
        // Upload artifacts to Supabase
        if (process.env.SUPABASE_URL && process.env.SUPABASE_URL !== 'your_supabase_url') {
            try {
                const remoteVideoPath = `${Date.now()}_${originalName}`;
                publicVideoUrl = await uploadFileToSupabase(filePath, 'subsync-files', remoteVideoPath);

                const remoteSrtPath = `${Date.now()}_${baseName}.srt`;
                publicSrtUrl = await uploadFileToSupabase(srtPath, 'subsync-files', remoteSrtPath);

                transcriptId = await saveTranscript({
                    original_text: transcriptionResult.text,
                    enhanced_text: enhancedText,
                    segments: transcriptionResult.segments,
                    cloud_video_url: publicVideoUrl,
                    cloud_srt_url: publicSrtUrl
                });

                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                if (fs.existsSync(targetAudioPath)) fs.unlinkSync(targetAudioPath);
                if (fs.existsSync(srtPath)) fs.unlinkSync(srtPath);
            } catch (err) {
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
    } catch (error: any) {
        console.error('Processing failed:', error);
        return res.status(500).json({ detail: `Processing failed: ${error.message}` });
    }
});

export default router;
