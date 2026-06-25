# SubSync

SubSync is an AI-powered transcription app that turns your videos and audio files into accurate SRT subtitles. It also summarizes the content and generates dual-language translations on the fly!

## Approach

- **Frontend:** Built with React, Vite, and Tailwind CSS. It handles the UI state, real-time recording, and smooth file uploads.
- **Backend:** A Node.js and Express server written in TypeScript. It acts as the "brain" of the app, routing audio to the right AI models.
- **AI Routing:** We don't rely on just one provider. The system dynamically routes transcription jobs to Groq Whisper, Deepgram, AssemblyAI, or even a local Whisper model for offline processing.
- **Post-Processing:** After the transcript is generated, we run it through LLaMA 3.1 (via Groq) to summarize the text and seamlessly add translated English subtitles beneath foreign languages.

## Enhancements

- **AI Text Enhancement:** The raw transcription text is fed into an AI model to generate a polished summary of the content, extracting key themes and improving overall readability.
- **Automatic Dual-Language Subtitles:** The system detects if the spoken audio is in a non-English language. If so, it translates each segment on the fly and seamlessly appends the English translation right below the original text.
- **Exportable SRTs:** Once processing is complete, users can instantly download the final, perfectly timestamped `.srt` file to use with any video player or editing software.

## Key Decisions

- **Local Audio Extraction:** Instead of uploading massive MP4 videos to AI APIs, our backend uses FFmpeg to locally extract and compress just the audio track. This saves a massive amount of bandwidth and prevents API timeouts!
- **TypeScript over LLM Formatting:** Large Language Models are notoriously bad at strictly formatting text (like getting brackets perfectly aligned). To stop the AI from hallucinating, we let the LLM handle just the raw translation, and we use strict TypeScript logic to append the translated text into brackets.
- **Stateless Cloud Storage:** To keep the server lightweight, we process files in temporary local folders, upload the final SRTs to Supabase, and immediately wipe the temp files.
- **Dynamic Token Limits:** Hardcoding token limits caused crashes on longer videos because Groq's free-tier rate limits are so strict. We removed the hardcoded limit, letting the API dynamically manage token constraints to completely eliminate "Payload Too Large" errors.

## Assumptions Made

- **File Sizes:** We assume the compressed audio files will stay under the standard 25MB limit of commercial APIs. For anything larger, the app relies on the local Whisper fallback model.
- **English as the Base:** We assume English is the primary language. If you upload French audio, it automatically appends English translations. If the audio is already in English, it skips the translation step entirely.
- **Audio Clarity:** We assume the uploaded audio isn't just static or silence. To stop the AI from hallucinating words during quiet parts, we gave the transcription models strict instructions to stick to the script.
