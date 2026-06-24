import Groq from 'groq-sdk';

export interface AISummary {
    title: string;
    language: string;
    duration: string;
    segments: number;
    wordCount: number;
    keyPoints: string[];
    sentiment: string;
    confidence: number;
}

export async function summarizeTranscript(srtText: string): Promise<AISummary> {
    const groq = new Groq({
        apiKey: process.env.GROQ_API_KEY,
    });

    const systemPrompt = `You are an expert transcriber and analyzer. 
You will receive a raw SRT transcript. You must analyze the text and output a JSON object exactly matching this interface:
{
  "title": "A short, descriptive title",
  "language": "The main language (e.g., English, Français)",
  "duration": "Estimated duration formatted as M:SS or H:MM:SS (e.g., 5:30) based on SRT timestamps",
  "segments": Number of subtitle segments,
  "wordCount": Approximate number of words,
  "keyPoints": ["Bullet 1", "Bullet 2", "Bullet 3"],
  "sentiment": "One or two words describing overall sentiment (e.g., Informative, Positive, Urgent)",
  "confidence": A float between 0.0 and 1.0 representing your confidence in the summary
}

ONLY OUTPUT VALID JSON.`;

    try {
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: srtText }
            ],
            model: 'llama-3.1-8b-instant',
            temperature: 0.1,
            response_format: { type: 'json_object' }
        });

        const content = chatCompletion.choices[0]?.message?.content || '{}';
        return JSON.parse(content) as AISummary;
    } catch (error: any) {
        console.error("Groq Summarization error:", error);
        throw new Error(`Summarization failed: ${error.message}`);
    }
}
