import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs';

if (ffmpegStatic) {
    ffmpeg.setFfmpegPath(ffmpegStatic);
}

export function extractAudio(videoPath: string, outputAudioPath: string, format: 'wav' | 'mp3' = 'wav'): Promise<string> {
    return new Promise((resolve, reject) => {
        if (fs.existsSync(outputAudioPath)) {
            fs.unlinkSync(outputAudioPath);
        }

        const command = ffmpeg(videoPath).output(outputAudioPath).audioChannels(1).audioFrequency(16000);
        
        if (format === 'wav') {
            command.audioCodec('pcm_s16le');
        } else {
            command.audioCodec('libmp3lame').audioBitrate('64k');
        }

        command
            .on('end', () => resolve(outputAudioPath))
            .on('error', (err) => reject(new Error(`FFmpeg failed to extract audio: ${err.message}`)))
            .run();
    });
}
