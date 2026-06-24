import { Router, Request, Response } from 'express';

import { getTranscript } from '../services/supabaseService';

const router = Router();

router.get('/:transcript_id', async (req: Request, res: Response): Promise<any> => {
    try {
        const { transcript_id } = req.params;
        const transcript = await getTranscript(transcript_id as string);
        
        return res.json({
            status: 'success',
            data: transcript
        });
    } catch (error: any) {
        return res.status(404).json({
            status: 'error',
            message: error.message
        });
    }
});

export default router;
