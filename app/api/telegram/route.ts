/**
 * Telegram webhook endpoint.
 *
 * Security:
 *  - Telegram is required to send the `X-Telegram-Bot-Api-Secret-Token`
 *    header matching TELEGRAM_WEBHOOK_SECRET (set when we registered the
 *    webhook). Unauthenticated POSTs are ignored with 401.
 *  - We additionally check that the update's user is our owner
 *    (TELEGRAM_OWNER_ID). Anyone else is silently ignored.
 *
 * Why this file is longer than you'd expect:
 *  - Telegram expects a 200 response fast. We do quick work synchronously,
 *    but catch errors so one failing command never retries forever.
 *  - We detect "reply to /edit prompt" here and route to upsertPost so the
 *    user can plain-text-reply with updated content.
 */

import { NextResponse } from "next/server";
import {
  confirmDelete,
  handleCommand,
  handleDocument,
  upsertPost,
  type BotContext,
} from "@/lib/bot";
import {
  answerCallbackQuery,
  editMessageText,
  sendMessage,
  type TgUpdate,
} from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Vercel Hobby allows up to 60s; we rarely need more than ~5s but GitHub
// occasionally takes longer on commit. Safe ceiling.
export const maxDuration = 30;

export async function POST(req: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "bot not configured" }, { status: 500 });
  }

  const providedSecret = req.headers.get("x-telegram-bot-api-secret-token");
  if (providedSecret !== secret) {
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
    // Respond 200 anyway so Telegram doesn't retry indefinitely.
  }

  return NextResponse.json({ ok: true });
}

async function routeUpdate(update: TgUpdate): Promise<void> {
  const ownerId = Number(process.env.TELEGRAM_OWNER_ID || 0);
  if (!ownerId) {
    console.warn("[telegram] TELEGRAM_OWNER_ID not set");
    return;
  }

  // Callback query (inline keyboard button press)
  if (update.callback_query) {
    const cq = update.callback_query;
    if (cq.from.id !== ownerId) {
      await answerCallbackQuery(cq.id, "Not authorized");
      return;
    }
    await handleCallback(update);
    return;
  }

  const msg = update.message ?? update.edited_message;
  if (!msg || !msg.from) return;
  if (msg.from.id !== ownerId) return;

  const ctx: BotContext = { chatId: msg.chat.id, message: msg };

  // Document upload (markdown file)
  if (msg.document) {
    await handleDocument(ctx);
    return;
  }

  const text = msg.text ?? msg.caption ?? "";
  if (!text) return;

  // Plain text reply to an /edit prompt → treat as updated content.
  const replyText = msg.reply_to_message?.text ?? "";
  const editSlug = replyText.match(/Editing `([^`]+)`/)?.[1];
  if (editSlug && !text.startsWith("/")) {
    await upsertPost(ctx, { slug: editSlug, rawContent: text, sourceHint: "reply" });
    return;
  }

  if (text.startsWith("/")) {
    await handleCommand(ctx, text);
    return;
  }

  // Free-form text without a command: nudge toward /help.
  await sendMessage(ctx.chatId, "Send /help to see what I can do.");
}

async function handleCallback(update: TgUpdate): Promise<void> {
  const cq = update.callback_query!;
  const data = cq.data ?? "";
  const chatId = cq.message?.chat.id;
  const messageId = cq.message?.message_id;

  if (!chatId || !messageId) {
    await answerCallbackQuery(cq.id);
    return;
  }

  if (data === "cancel") {
    await answerCallbackQuery(cq.id, "Cancelled");
    await editMessageText(chatId, messageId, "Cancelled.");
    return;
  }

  if (data.startsWith("del:")) {
    const [, slug, kind] = data.split(":");
    if (slug && (kind === "post" || kind === "draft")) {
      await answerCallbackQuery(cq.id, "Deleting…");
      try {
        const result = await confirmDelete(chatId, slug, kind);
        await editMessageText(chatId, messageId, result);
      } catch (err) {
        await editMessageText(
          chatId,
          messageId,
          `Delete failed: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
      return;
    }
  }

  await answerCallbackQuery(cq.id);
}
