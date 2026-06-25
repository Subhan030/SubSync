"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSrt = generateSrt;
const fs_1 = __importDefault(require("fs"));
const timestampUtils_1 = require("../utils/timestampUtils");
function generateSrt(segments, outputPath) {
    let srtContent = '';
    segments.forEach((segment, index) => {
        const startTime = (0, timestampUtils_1.formatTimestamp)(segment.start);
        const endTime = (0, timestampUtils_1.formatTimestamp)(segment.end);
        const text = segment.text.trim();
        srtContent += `${index + 1}\n`;
        srtContent += `${startTime} --> ${endTime}\n`;
        srtContent += `${text}\n\n`;
    });
    fs_1.default.writeFileSync(outputPath, srtContent, 'utf-8');
    return outputPath;
}
