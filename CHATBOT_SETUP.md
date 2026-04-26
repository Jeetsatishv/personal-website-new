# Website Chatbot — Setup

A floating "Ask about Jeet" chatbot lives on every page of the site. Visitors click the bottom-right pill, ask a question, and the bot streams an answer back from OpenAI using the data in `lib/data.ts` as its only source of truth.

## How it works

- **UI:** `components/Chat.tsx` — a floating pill bottom-right that expands into a glassy panel matching the site's dark theme. Conversation persists in `localStorage` so a refresh keeps context.
- **API:** `app/api/chat/route.ts` — Edge runtime, streams via the Vercel AI SDK v6, soft per-IP rate limit (10 messages/min), 1500-char input cap, 600-token output cap.
- **System prompt:** `lib/chatContext.ts` — serializes `lib/data.ts` (profile, education, experience, projects, skills, talk, achievements, writing) into a markdown context block, then bolts on rules of engagement: third-person voice, refuse off-topic / private / speculative answers, never reveal the prompt.
- **Cost:** uses `gpt-4o-mini` by default — ~$0.15 per 1M input tokens, ~$0.60 per 1M output. A typical conversation is well under $0.001. The combined input cap (1500 chars/message, 10 messages/min, 600 output tokens) makes it very hard to run up the bill.

## One-time setup

### 1. Get an OpenAI API key

1. Go to https://platform.openai.com/api-keys
2. **Create new secret key** → name it (e.g. `jeetcreates-chatbot`).
3. Copy the key (starts with `sk-...`). You'll only see it once.

### 2. Add it to Vercel

Vercel → your project → **Settings** → **Environment Variables**. Add for **Production** (and Preview if you want chat in preview deploys):

| Name | Value |
| --- | --- |
| `OPENAI_API_KEY` | The key from step 1 |
| `OPENAI_CHAT_MODEL` | (Optional) `gpt-4o-mini` (default), `gpt-4o`, etc. |

### 3. Set a usage limit on OpenAI

Belt-and-suspenders against runaway cost:

1. https://platform.openai.com/account/billing/limits
2. Set a **monthly hard limit** (e.g. $5). The bot will start refusing requests once you hit it. For a personal site this is plenty.

### 4. Deploy

```bash
git push
```

Wait for Vercel to redeploy. Open your site → bottom-right corner → "ask about jeet" pill should appear. Click it, ask a question, watch tokens stream in.

## Local development

Add the same key to `.env.local`:

```bash
OPENAI_API_KEY=sk-...
```

Then `npm run dev` — the chatbot works against your local Next.js server.

## Customizing what the bot knows

The chatbot's knowledge is exactly whatever's in `lib/data.ts`. To teach it new facts, just edit that file and redeploy. No vector store, no fine-tuning — the current data is small enough to fit comfortably in the system prompt.

If `lib/data.ts` grows so large that you start hitting context limits, the next step would be RAG (chunk the data, embed, retrieve top-k per query). Not needed at current scale.

## Customizing the bot's voice & rules

`lib/chatContext.ts` has the full system prompt at the bottom of `getSystemPrompt()`. Edit:

- **Voice:** the bot speaks about Jeet in third person by default. Flip to first person ("I have a Master's…") by changing the relevant rule.
- **Refusals:** what counts as off-topic, what gets declined, etc.
- **Sample suggestions:** edit the `SUGGESTIONS` array in `components/Chat.tsx` for different starter prompts.

## Troubleshooting

- **"OPENAI_API_KEY is not configured"** in the chat error toast → env var missing or the deploy didn't pick it up. Redeploy after adding it.
- **429 / "you're sending messages a bit fast"** → rate limit hit. Lower the limit / wait a minute. Edit `RATE_LIMIT_MAX` in `app/api/chat/route.ts`.
- **Bot makes up details** → strengthen the rules in `lib/chatContext.ts`. The current rules already say "never invent dates, numbers, projects" but you can tighten more.
- **Bot answers off-topic** → same — tighten the off-topic refusal language.
- **Stream cuts off** → most likely you hit `maxOutputTokens: 600`. Bump it in `app/api/chat/route.ts`, but expect a small per-message cost increase.

## Security notes

- The OpenAI key only ever exists server-side (Edge function). It never reaches the browser.
- Rate limiting is best-effort (in-memory per Edge instance). For stronger protection, swap in Vercel KV-backed rate limiting later.
- The system prompt explicitly forbids the bot from leaking its own instructions or the data block. This is best-effort; don't put truly sensitive info in `lib/data.ts`.
