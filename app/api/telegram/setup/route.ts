/**
 * One-shot webhook registration endpoint.
 *
 * Usage (after deploying to Vercel):
 *   GET https://<your-site>/api/telegram/setup?key=<TELEGRAM_WEBHOOK_SECRET>
 *
 * This calls Telegram's setWebhook so future bot updates are POSTed to
 * /api/telegram on this deployment. Safe to hit multiple times — Telegram
 * just overwrites the previous webhook URL.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!token || !secret) {
    return NextResponse.json(
      { error: "TELEGRAM_BOT_TOKEN or TELEGRAM_WEBHOOK_SECRET not set" },
      { status: 500 },
    );
  }

  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  if (key !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Build webhook URL from the site the user hit. Prefer the custom env var
  // when set (so a preview deploy can still register against production).
  const siteUrl =
    process.env.TELEGRAM_WEBHOOK_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    `${url.protocol}//${url.host}`;
  const webhookUrl = `${siteUrl.replace(/\/$/, "")}/api/telegram`;

  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: secret,
      allowed_updates: ["message", "edited_message", "callback_query"],
      drop_pending_updates: true,
    }),
  });

  const data = (await res.json()) as { ok: boolean; description?: string };
  return NextResponse.json({
    ok: data.ok,
    webhookUrl,
    description: data.description,
  });
}
