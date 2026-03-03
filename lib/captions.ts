import OpenAI from 'openai';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execFileAsync = promisify(execFile);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface GeneratedCaptions {
  tiktok: string;
  youtube_title: string;
  youtube_desc: string;
  instagram: string;
  x: string;
  linkedin: string;
}

/**
 * Transcribe a video file using Whisper.
 * Returns the transcript text and detected language.
 */
async function transcribeVideo(videoPath: string): Promise<{ text: string; language: string }> {
  const tmpDir = os.tmpdir();
  const audioPath = path.join(tmpDir, `audio_${Date.now()}.mp3`);

  try {
    // Extract audio with ffmpeg
    await execFileAsync('/opt/homebrew/bin/ffmpeg', [
      '-i', videoPath,
      '-vn', '-acodec', 'libmp3lame', '-q:a', '4',
      '-y', audioPath,
    ], { timeout: 60000 });

    // Transcribe with Whisper API (faster + language detection)
    const audioFile = fs.createReadStream(audioPath);
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'verbose_json',
    });

    const text = transcription.text || '';
    const language = (transcription as { language?: string }).language || 'unknown';

    return { text, language };
  } finally {
    // Cleanup audio file
    try { fs.unlinkSync(audioPath); } catch { /* ignore */ }
  }
}

/**
 * Generate captions from actual video transcript.
 * RULE: Only use words and sentences actually spoken in the video,
 * in the language they were spoken in.
 */
export async function generateCaptions(
  igCaption: string,
  _description: string,
  options?: {
    videoPath?: string;
    isYouTube?: boolean;
    youtubeVideoId?: string | null;
  }
): Promise<GeneratedCaptions> {
  // If we have the video file, transcribe it first
  let transcript = '';
  let language = 'unknown';

  if (options?.videoPath && fs.existsSync(options.videoPath)) {
    try {
      const result = await transcribeVideo(options.videoPath);
      transcript = result.text;
      language = result.language;
      console.log(`Transcribed video: language=${language}, length=${transcript.length}`);
    } catch (err) {
      console.error('Transcription failed, falling back to IG caption:', err);
    }
  }

  // If no transcript, use the IG caption as-is
  if (!transcript && igCaption) {
    transcript = igCaption;
  }

  // If we still have nothing, return minimal captions
  if (!transcript || transcript.trim().length < 5) {
    return {
      tiktok: igCaption || '',
      youtube_title: igCaption || 'New Video',
      youtube_desc: igCaption || '',
      instagram: igCaption || '',
      x: igCaption || '',
      linkedin: igCaption || '',
    };
  }

  const prompt = `You are reformatting a video's own words into platform captions.

TRANSCRIPT (from the actual video):
"""
${transcript}
"""

INSTAGRAM CAPTION (original): ${igCaption || 'none'}
LANGUAGE DETECTED: ${language}

STRICT RULES:
1. You may ONLY use words and sentences that were actually spoken in the video.
2. Keep the SAME LANGUAGE as the video. If the video is in German, all captions must be in German. If English, English. Never translate.
3. The title should be a short, punchy excerpt or summary using the speaker's own words.
4. The description should use actual quotes or paraphrases from the transcript.
5. Do NOT add hashtags that weren't in the original caption.
6. Do NOT invent new sentences, marketing copy, or calls to action.
7. Keep it authentic — this is the creator's voice, not yours.

Generate captions using ONLY the creator's own words:

YOUTUBE_TITLE: Short, compelling excerpt from the transcript (max 100 chars). Use their words.
YOUTUBE_DESC: A few key lines from the transcript that summarize the content. Max 300 chars.
TIKTOK: 1-2 punchy sentences from the transcript. Max 300 chars. Add the original IG caption's emojis/hashtags if any.
INSTAGRAM: Keep similar to the original IG caption. If the original was just emojis, keep it minimal.
X: One strong line from the transcript. Max 240 chars.
LINKEDIN: A meaningful quote from the transcript. Max 300 chars.

Respond with ONLY valid JSON:
{
  "tiktok": "...",
  "youtube_title": "...",
  "youtube_desc": "...",
  "instagram": "...",
  "x": "...",
  "linkedin": "..."
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    temperature: 0.3,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error('No response from OpenAI');

  return JSON.parse(content) as GeneratedCaptions;
}
