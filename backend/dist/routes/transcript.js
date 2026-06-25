"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabaseService_1 = require("../services/supabaseService");
const router = (0, express_1.Router)();
router.get('/:transcript_id', async (req, res) => {
    try {
        const { transcript_id } = req.params;
        const transcript = await (0, supabaseService_1.getTranscript)(transcript_id);
        return res.json({
            status: 'success',
            data: transcript
        });
    }
    catch (error) {
        return res.status(404).json({
            status: 'error',
            message: error.message
        });
    }
});
exports.default = router;
