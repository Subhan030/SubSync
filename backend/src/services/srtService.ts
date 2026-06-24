import fs from 'fs';
import { formatTimestamp } from '../utils/timestampUtils';

export function generateSrt(segments: any[], outputPath: string): string {
    let srtContent = '';
    
    segments.forEach((segment, index) => {
        const startTime = formatTimestamp(segment.start);
        const endTime = formatTimestamp(segment.end);
        const text = segment.text.trim();
        
        srtContent += `${index + 1}\n`;
        srtContent += `${startTime} --> ${endTime}\n`;
        srtContent += `${text}\n\n`;
    });
    
    fs.writeFileSync(outputPath, srtContent, 'utf-8');
    return outputPath;
}
