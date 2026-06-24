import { Router, Request, Response } from 'express';
import { summarizeTranscript } from '../services/summarizeService';

const router = Router();

router.post('/', async (req: Request, res: Response): Promise<any> => {
    try {
        const { srtText } = req.body;
        if (!srtText) {
            return res.status(400).json({ detail: 'No srtText provided' });
        }

        const summary = await summarizeTranscript(srtText);

        return res.json({
            status: 'success',
            data: summary
        });
    } catch (error: any) {
        console.error('Summarization failed:', error);
        return res.status(500).json({ detail: `Summarization failed: ${error.message}` });
    }
});

export default router;
