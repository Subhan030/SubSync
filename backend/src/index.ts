import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.join(__dirname, '../../.env') });

import express from 'express';
import cors from 'cors';
import uploadRouter from './routes/upload';
import transcriptRouter from './routes/transcript';
import summarizeRouter from './routes/summarize';

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/upload', uploadRouter);
app.use('/api/transcript', transcriptRouter);
app.use('/api/summarize', summarizeRouter);

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the SubSync API! (Node.js version)' });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://127.0.0.1:${PORT}`);
});
