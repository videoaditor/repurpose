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
  description: string
): Promise<GeneratedCaptions> {
  const prompt = `You are a social media expert. Generate platform-optimized captions for a video.

Video Title: ${title}
Base Description: ${description}

Generate captions for each platform following these STRICT rules:

TIKTOK: Punchy, 1-2 sentences max. Add 3-5 relevant hashtags. Max 300 characters total.

YOUTUBE_TITLE: SEO-friendly title, max 100 characters. Can be different from original title if it improves SEO.

YOUTUBE_DESC: 150-300 characters. Natural, conversational tone. Include 3 hashtags at the very bottom on a new line.

INSTAGRAM: Engaging hook + body, max 150 characters. Then on a new line add 5-8 hashtags.

X: Max 240 characters total. Engaging, conversational. Max 1-2 hashtags only (or none). No hashtag spam.

LINKEDIN: Professional tone, 200-300 characters. No hashtags. Focus on value/insight from the content.

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
