import OpenAI from 'openai';

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

export async function generateCaptions(
  title: string,
  description: string,
  options?: {
    isYouTube?: boolean;
    youtubeVideoId?: string | null;
  }
): Promise<GeneratedCaptions> {
  const isYouTube = options?.isYouTube ?? false;

  const youtubeContext = isYouTube
    ? `\nIMPORTANT CONTEXT: This content is being repurposed FROM a YouTube video. The creator posts on YouTube and wants to distribute this content to other platforms. Reference the YouTube video origin naturally in captions where appropriate. The content style is likely educational, tutorial, commentary, or entertainment — tailor the tone based on the title. For the YouTube title and description fields, treat this as an update/variant of their existing YouTube upload.`
    : '';

  const prompt = `You are a social media expert specializing in content repurposing. Generate platform-optimized captions for a video.

Video Title: ${title}
Base Description: ${description}${youtubeContext}

Generate captions for each platform following these STRICT rules:

TIKTOK: Punchy, 1-2 sentences max. Hook-first — start with the most engaging line. Add 3-5 relevant hashtags. Max 300 characters total.

YOUTUBE_TITLE: SEO-friendly title, max 100 characters. Optimize for search. Can differ from original if it improves discoverability.

YOUTUBE_DESC: 150-300 characters. Natural, conversational tone. Include a call to action. Add 3 hashtags at the very bottom on a new line.

INSTAGRAM: Engaging hook + body, max 150 characters. Then on a new line add 5-8 hashtags.

X: Max 240 characters total. Engaging, conversational, opinion-forward. Max 1-2 hashtags only (or none).

LINKEDIN: Professional tone, 200-300 characters. No hashtags. Focus on insight or value from the content. Written as a thought leader post.

Respond with ONLY valid JSON in this exact format:
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
    temperature: 0.7,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error('No response from OpenAI');

  return JSON.parse(content) as GeneratedCaptions;
}
