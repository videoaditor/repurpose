This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## Instagram → TikTok + YouTube Auto-Poster (n8n)

Polls `@alanoderso` every hour. When a new reel is detected, auto-posts to TikTok + YouTube via Upload-Post with platform-optimized captions. Sends you a Telegram notification when it fires.

### Setup (5 min)

**1. Import the workflow**
- Open your n8n instance
- New Workflow → Import from File → select `n8n-instagram-autoposter.json`

**2. Add credentials (n8n Credentials panel)**

| Credential | Type | Value |
|---|---|---|
| Instagram Access Token | HTTP Query Auth | Your IG long-lived token (get from graph.facebook.com/me?access_token=...) |
| Upload-Post API Key | HTTP Header Auth | Your Upload-Post API key |
| Telegram Bot | Telegram API | Your bot token (already set up) |

**3. Set your Upload-Post username**
- In n8n: Settings → Variables → Add `UPLOAD_POST_USERNAME` = your Upload-Post profile username

**4. Get your Instagram Access Token**
- Go to: https://developers.facebook.com/tools/explorer
- Select your app → Get User Access Token → check `instagram_basic` + `pages_read_engagement`
- Exchange for a long-lived token (lasts 60 days, auto-refresh available)

**5. Activate**
- Toggle the workflow ON
- It runs every hour. First run saves the current latest reel as "seen" — subsequent runs only post NEW content.

### What it does
1. Every hour: fetches your 5 latest IG posts
2. Filters for VIDEO/REELS only
3. Checks if any are newer than last run (uses n8n static data — persists across runs)
4. Generates TikTok caption (punchy, 300 chars, keeps hashtags) + YouTube title/description
5. Posts to TikTok + YouTube via Upload-Post API
6. Sends Telegram DM: "✅ Auto-posted to TikTok + YouTube"

