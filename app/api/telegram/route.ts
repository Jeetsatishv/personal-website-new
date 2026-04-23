/**
 * Telegram webhook endpoint.
 *
 * Security:
 *  - Telegram is required to send the `X-Telegram-Bot-Api-Secret-Token`
 *    header matching TELEGRAM_WEBHOOK_SECRET. Unauthenticated POSTs return 401.
 *  - We additionally check that every update's user.id matches
 *    TELEGRAM_OWNER_ID. Anyone else is silently ignored.
 */

import { NextResponse } from "next/server";
import { handleCallback, handleDocument, handleText, type BotContext } from "@/lib/bot";
import type { TgUpdate } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Hobby plan allows up to 60s. 5–10s is typical; 30s gives us headroom
// when the GitHub API is slow.
export const maxDuration = 30;

export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "bot not configured" }, { status: 500 });
  }
  if (req.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let update: TgUpdate;
  try {
    update = (await req.json()) as TgUpdate;
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  try {
    await routeUpdate(update);
  } catch (err) {
    console.error("[telegram] handler error", err);
    // Always return 200 so Telegram doesn't retry forever.
  }

  return NextResponse.json({ ok: true });
}

async function routeUpdate(update: TgUpdate): Promise<void> {
  const ownerId = Number(process.env.TELEGRAM_OWNER_ID || 0);
  if (!ownerId) {
    console.warn("[telegram] TELEGRAM_OWNER_ID not set");
    return;
  }

  // Inline keyboard button press.
  if (update.callback_query) {
    const cq = update.callback_query;
    if (cq.from.id !== ownerId) return;
    await handleCallback({
      chatId: cq.message?.chat.id ?? cq.from.id,
      messageId: cq.message?.message_id ?? 0,
      data: cq.data ?? "",
      callbackQueryId: cq.id,
      currentText: cq.message?.text ?? "",
    });
    return;
  }

  const msg = update.message ?? update.edited_message;
  if (!msg || !msg.from) return;
  if (msg.from.id !== ownerId) return;

  const ctx: BotContext = { chatId: msg.chat.id, message: msg };

  if (msg.document) {
    await handleDocument(ctx);
    return;
  }

  const text = msg.text ?? msg.caption ?? "";
  if (!text) return;

  await handleText(ctx, text);
}
