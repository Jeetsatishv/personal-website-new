# Telegram Blog Bot — Setup

This repo ships with a Telegram bot that lets you **create, edit, delete, list, and view** blog posts by chatting with it. It runs as a Vercel serverless webhook in this same Next.js project — no always-on server, no Mac mini needed.

## How it works

1. You send a message or upload a `.md` file to your bot in Telegram.
2. Telegram POSTs the update to `/api/telegram` on your Vercel deployment.
3. The handler commits an MDX file to `content/posts/` (or `content/drafts/`) in GitHub using the Contents API.
4. Vercel auto-deploys the commit. The post is live within ~30s.

No database. No KV store. Your git history is your audit log.

---

## One-time setup (do this once)

### 1. Create the bot with @BotFather

In Telegram, message [@BotFather](https://t.me/BotFather):

- `/newbot` → pick a display name and a unique username ending in `bot` (e.g. `jeet_blog_bot`).
- Copy the **bot token** it gives you (looks like `1234567890:AA...`).
- Optional but recommended: `/setcommands` → paste:

```
menu - show the main menu
new - create a new post (guided wizard)
list - list published posts
drafts - list draft posts
help - show the full help
```

### 2. Get your Telegram user ID

Message [@userinfobot](https://t.me/userinfobot). It will reply with your numeric ID (e.g. `123456789`). Save it — only this ID will be allowed to command the bot.

### 3. Create a GitHub fine-grained PAT

1. Go to https://github.com/settings/personal-access-tokens/new.
2. **Resource owner**: you (`Jeetsatishv`).
3. **Repository access**: "Only select repositories" → pick `personal-website-new`.
4. **Repository permissions** → **Contents**: `Read and write`.
5. **Expiration**: pick whatever you're comfortable with (90 days minimum; `No expiration` is fine for personal use).
6. Copy the token (starts with `github_pat_...`).

### 4. Generate a webhook secret

Any long random string. On macOS:

```bash
openssl rand -hex 24
```

Copy the output.

### 5. Add env vars to Vercel

Go to https://vercel.com/ → your project → **Settings** → **Environment Variables**. Add these for **Production** (and Preview if you want the bot to work from preview deploys):

| Name | Value |
| --- | --- |
| `TELEGRAM_BOT_TOKEN` | From step 1 |
| `TELEGRAM_OWNER_ID` | From step 2 |
| `TELEGRAM_WEBHOOK_SECRET` | From step 4 |
| `GITHUB_TOKEN` | From step 3 |
| `GITHUB_OWNER` | `Jeetsatishv` |
| `GITHUB_REPO` | `personal-website-new` |
| `GITHUB_BRANCH` | `main` |

### 6. Deploy

```bash
git add .
git commit -m "feat: add telegram blog bot"
git push
```

Wait for the Vercel deploy to go green.

### 7. Register the webhook with Telegram

Visit this URL **once**, replacing values:

```
https://<your-site>.vercel.app/api/telegram/setup?key=<TELEGRAM_WEBHOOK_SECRET>
```

If you have a custom domain (e.g. `jeet.dev`), use that instead.

You should see a JSON response with `"ok": true`. Telegram now knows where to send updates.

### 8. Say hi

Open your bot in Telegram, send `/start`. You should get the help message.

---

## Using the bot

The bot is fully button-driven — you rarely need to type commands.

### Main menu

Send any message (or `/start`, or `/menu`) and you'll get a menu with four buttons:

- **📝 New post** — guided wizard
- **📋 Posts** — list your published posts
- **📄 Drafts** — list your drafts
- **ℹ️ Help**

### Creating a post — the wizard

Tap **📝 New post**. The bot walks you through:

1. **Title** (required)
2. **Description** — reply with text, or send `-` to skip
3. **Date** — reply with `YYYY-MM-DD`, or `-` for today
4. **Tags** — comma-separated (e.g. `ai, security`), or `-` to skip
5. **Slug** — or `-` to auto-generate from the title
6. **Visibility** — tap **🟢 Publish now** or **📄 Save as draft**
7. **Body** — reply with the post body in markdown, **or upload a `.md`/`.mdx` file**

Any step: type `cancel` or tap Cancel to abort.

### Creating a post — upload a file

At any time, just upload a `.md` or `.mdx` document with frontmatter. The filename (without extension) becomes the slug. Skips the wizard entirely.

```markdown
---
title: "My post title"
description: "Short summary"
date: "2026-04-23"
tags: ["ai", "security"]
draft: false
---

Post body here.
```

### Managing existing posts

Tap **📋 Posts** (or **📄 Drafts**), pick a post, and you get:

- **👁 View** — bot sends you the `.mdx` file
- **✏️ Edit** — opens a per-field edit menu (title / description / date / tags / body)
- **📄 Unpublish** or **🟢 Publish** — flips draft status
- **🗑 Delete** — with confirmation

### Power-user shortcuts

All the old commands still work:

- `/new` — start the wizard
- `/list`, `/drafts`, `/view <slug>`, `/edit <slug>`, `/delete <slug>`, `/publish <slug>`, `/unpublish <slug>`
- `/menu` — main menu
- `/help` — this reference

### Drafts

Drafts live in `content/drafts/` and are invisible to the public site. Publishing moves them to `content/posts/`. Posts with `draft: true` in frontmatter are also hidden from the index as a safety net.

---

## Troubleshooting

- **Bot doesn't respond at all** → the webhook probably isn't registered. Hit `/api/telegram/setup?key=...` again and check the JSON response.
- **"unauthorized"** on setup URL → your `key` param doesn't match `TELEGRAM_WEBHOOK_SECRET` in Vercel.
- **Bot responds "Not authorized" to callback presses** → `TELEGRAM_OWNER_ID` doesn't match your account. Double-check with @userinfobot.
- **GitHub API errors** → check the PAT has `Contents: Read and write` on this specific repo and hasn't expired.
- **Inspect webhook state**: `https://api.telegram.org/bot<TOKEN>/getWebhookInfo` shows the current webhook URL, secret presence, and any recent delivery errors.
- **Deployment logs**: Vercel → Deployments → latest → Functions → `/api/telegram` to see what went wrong.

## Rotating the secret or token

Update the env var in Vercel, redeploy, then re-hit `/api/telegram/setup?key=<new-secret>` to push the new secret to Telegram.

## Security notes

- The webhook authenticates Telegram via the `X-Telegram-Bot-Api-Secret-Token` header — unauthenticated POSTs are rejected.
- Each update is then filtered by `TELEGRAM_OWNER_ID`, so even if someone discovered your bot username they couldn't use it.
- The GitHub PAT is scoped to this one repo with contents-only permission — the blast radius of a leak is "someone can edit this blog".
