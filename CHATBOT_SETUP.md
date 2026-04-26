# Website Chatbot — Setup

A floating "Ask about Jeet" chatbot lives on every page of the site. Visitors click the bottom-right pill, ask a question, and the bot streams an answer back from **Google Gemini** using the data in `lib/data.ts` as its only source of truth.

## How it works

- **UI:** `components/Chat.tsx` — a floating pill bottom-right that expands into a glassy panel matching the site's dark theme. Conversation persists in `localStorage` so a refresh keeps context.
- **API:** `app/api/chat/route.ts` — Edge runtime, streams via the Vercel AI SDK v6, soft per-IP rate limit (10 messages/min), 1500-char input cap, 600-token output cap.
- **System prompt:** `lib/chatContext.ts` — serializes `lib/data.ts` (profile, education, experience, projects, skills, talk, achievements, writing) into a markdown context block, then bolts on rules of engagement: third-person voice, refuse off-topic / private / speculative answers, never reveal the prompt.
- **Provider:** Google Gemini via `@ai-sdk/google`. Default model is `gemini-2.5-flash` (free tier comfortably handles a personal site). If your Google account has AI Pro, the same key transparently uses your higher quota; you can also flip the model env var to `gemini-2.5-pro` for higher-quality answers.

## One-time setup

### 1. Get a Gemini API key

1. Go to https://aistudio.google.com/apikey
2. Click **Create API key** → pick the project you want billing/quotas tied to (the default is fine)
3. Copy the key — starts with `AIzaSy...`

The same key is used for both the free tier and any paid AI Pro quota you have. Google routes the request to your highest-tier eligible quota automatically.

### 2. Add it to Vercel

Vercel → your project → **Settings** → **Environment Variables**. Add for **Production** (and Preview if you want chat in preview deploys):

| Name | Value | Notes |
| --- | --- | --- |
| `GOOGLE_GENERATIVE_AI_API_KEY` | The key from step 1 | Required |
| `GEMINI_CHAT_MODEL` | `gemini-2.5-flash` | Optional. Default is flash. Switch to `gemini-2.5-pro` if you have AI Pro and want higher quality. |

### 3. Redeploy

Env vars only take effect on **new** deploys. Two ways:
- Vercel → Deployments → ⋯ menu on latest → **Redeploy**, OR
- push any change (whitespace is fine) and it'll deploy fresh

### 4. Test

Once the deploy goes green:
1. Hard refresh your site (Cmd+Shift+R) to skip stale cache
2. Open the chat → tap **CLEAR** to wipe any prior error history
3. Ask: "What does Jeet work on?"

You should see tokens stream in.

## Free tier vs. AI Pro

| What you get | Free tier | AI Pro |
| --- | --- | --- |
| `gemini-2.5-flash` rate limit | 10 RPM, 250 RPD | Higher (varies) |
| `gemini-2.5-pro` rate limit | 5 RPM, 100 RPD | Much higher |
| Cost | $0 | Included with your Google AI Pro subscription |

For a personal portfolio site, the **free tier is more than enough**. Google's quotas reset daily. You don't need to set any explicit billing limits — if you blow past the free quota the bot just returns 429 errors until the daily window resets, no surprise charges.

If you want to use AI Pro quota explicitly, make sure the API key was created in a Google Cloud project linked to your AI Pro account. Check at https://aistudio.google.com/apikey — the project picker shows which project owns each key.

## Local development

Add the same key to `.env.local`:

```bash
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSy...
```

Then `npm run dev` — the chatbot works against your local Next.js server.

## Customizing what the bot knows

The chatbot's knowledge is exactly whatever's in `lib/data.ts`. To teach it new facts, just edit that file and redeploy. No vector store, no fine-tuning — the current data is small enough to fit comfortably in the system prompt (Gemini supports very large contexts, so you have a lot of headroom).

## Customizing the bot's voice & rules

`lib/chatContext.ts` has the full system prompt at the bottom of `getSystemPrompt()`. Edit:

- **Voice:** the bot speaks about Jeet in third person by default. Flip to first person ("I have a Master's…") by changing the relevant rule.
- **Refusals:** what counts as off-topic, what gets declined, etc.
- **Sample suggestions:** edit the `SUGGESTIONS` array in `components/Chat.tsx` for different starter prompts.

## Troubleshooting

- **"GOOGLE_GENERATIVE_AI_API_KEY is not configured"** in the chat error toast → env var missing in Vercel, or the deploy hasn't picked it up yet. Redeploy after adding it.
- **`429 Resource has been exhausted`** → you've hit Gemini's free-tier daily quota (or your AI Pro quota). Wait for the daily reset, or switch to a less-loaded model via `GEMINI_CHAT_MODEL` env var.
- **`401 / API key not valid`** → typo in the key, or the key was disabled in https://aistudio.google.com/apikey.
- **`429 / "you're sending messages a bit fast"`** (different 429 — comes from our own server, not Google) → our app-level rate limit fired. Wait a minute or edit `RATE_LIMIT_MAX` in `app/api/chat/route.ts`.
- **Bot makes up details** → strengthen the rules in `lib/chatContext.ts`. The current rules already say "never invent dates, numbers, projects" but you can tighten more.
- **Bot answers off-topic** → same — tighten the off-topic refusal language.
- **Stream cuts off** → most likely you hit `maxOutputTokens: 600`. Bump it in `app/api/chat/route.ts`.

## Security notes

- The Gemini key only ever exists server-side (Edge function). It never reaches the browser.
- Rate limiting is best-effort (in-memory per Edge instance). Good enough to deter casual abuse on a personal site; for stronger protection, swap in Vercel KV-backed rate limiting later.
- The system prompt explicitly forbids the bot from leaking its own instructions or the data block. This is best-effort; don't put truly sensitive info in `lib/data.ts`.
