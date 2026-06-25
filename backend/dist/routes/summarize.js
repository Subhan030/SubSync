"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const summarizeService_1 = require("../services/summarizeService");
const router = (0, express_1.Router)();
router.post('/', async (req, res) => {
    try {
        const { srtText } = req.body;
        if (!srtText) {
            return res.status(400).json({ detail: 'No srtText provided' });
        }
        const summary = await (0, summarizeService_1.summarizeTranscript)(srtText);
        return res.json({
            status: 'success',
            data: summary
        });
    }
    catch (error) {
        console.error('Summarization failed:', error);
        return res.status(500).json({ detail: `Summarization failed: ${error.message}` });
    }
});
exports.default = router;
