/**
 * Minimal Telegram Bot API helpers. Uses plain fetch so we can run anywhere
 * (Vercel serverless, Node, Edge) without extra dependencies.
 */

function tgApi(method: string): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("Missing env var: TELEGRAM_BOT_TOKEN");
  return `https://api.telegram.org/bot${token}/${method}`;
}

function tgFileApi(filePath: string): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("Missing env var: TELEGRAM_BOT_TOKEN");
  return `https://api.telegram.org/file/bot${token}/${filePath}`;
}

async function tgCall<T = unknown>(
  method: string,
  payload: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(tgApi(method), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json()) as { ok: boolean; result: T; description?: string };
  if (!data.ok) throw new Error(`Telegram ${method} failed: ${data.description}`);
  return data.result;
}

export async function sendMessage(
  chatId: number,
  text: string,
  opts: {
    parseMode?: "Markdown" | "MarkdownV2" | "HTML";
    replyMarkup?: unknown;
    disablePreview?: boolean;
    forceReply?: boolean;
  } = {},
) {
  // Telegram message limit is 4096 chars. Split into chunks to be safe.
  const chunks = splitMessage(text, 3800);
  const replyMarkup = opts.forceReply
    ? { force_reply: true, input_field_placeholder: "Type here…" }
    : opts.replyMarkup;
  for (let i = 0; i < chunks.length; i++) {
    await tgCall("sendMessage", {
      chat_id: chatId,
      text: chunks[i],
      parse_mode: opts.parseMode,
      disable_web_page_preview: opts.disablePreview ?? true,
      reply_markup: i === chunks.length - 1 ? replyMarkup : undefined,
    });
  }
}

export async function answerCallbackQuery(id: string, text?: string) {
  await tgCall("answerCallbackQuery", { callback_query_id: id, text });
}

export async function editMessageText(
  chatId: number,
  messageId: number,
  text: string,
  opts: { parseMode?: "Markdown" | "MarkdownV2" | "HTML"; replyMarkup?: unknown } = {},
) {
  await tgCall("editMessageText", {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: opts.parseMode,
    disable_web_page_preview: true,
    reply_markup: opts.replyMarkup,
  });
}

export async function sendDocument(
  chatId: number,
  filename: string,
  content: string,
  caption?: string,
) {
  const form = new FormData();
  form.append("chat_id", String(chatId));
  if (caption) form.append("caption", caption);
  form.append(
    "document",
    new Blob([content], { type: "text/markdown" }),
    filename,
  );
  const res = await fetch(tgApi("sendDocument"), { method: "POST", body: form });
  const data = (await res.json()) as { ok: boolean; description?: string };
  if (!data.ok) throw new Error(`Telegram sendDocument failed: ${data.description}`);
}

/**
 * Fetch a document that the user uploaded to the bot and return its UTF-8
 * contents. Telegram gives us a file_id; we resolve that to a download URL
 * via getFile, then fetch the raw bytes.
 */
export async function downloadFile(fileId: string): Promise<string> {
  const info = await tgCall<{ file_path: string; file_size?: number }>("getFile", {
    file_id: fileId,
  });
  if (info.file_size && info.file_size > 1_000_000) {
    throw new Error("File too large (>1MB). Please upload a smaller markdown file.");
  }
  const res = await fetch(tgFileApi(info.file_path));
  if (!res.ok) throw new Error(`Failed to download Telegram file: ${res.status}`);
  return await res.text();
}

function splitMessage(text: string, max: number): string[] {
  if (text.length <= max) return [text];
  const out: string[] = [];
  let remaining = text;
  while (remaining.length > max) {
    let cut = remaining.lastIndexOf("\n", max);
    if (cut < max / 2) cut = max;
    out.push(remaining.slice(0, cut));
    remaining = remaining.slice(cut);
  }
  if (remaining) out.push(remaining);
  return out;
}

// ---- Update types (minimal subset we need) --------------------------------

export interface TgUser {
  id: number;
  is_bot: boolean;
  first_name?: string;
  username?: string;
}

export interface TgChat {
  id: number;
  type: string;
}

export interface TgDocument {
  file_id: string;
  file_unique_id: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
}

export interface TgMessageEntity {
  type: string;
  offset: number;
  length: number;
  url?: string;
}

export interface TgMessage {
  message_id: number;
  from?: TgUser;
  chat: TgChat;
  date: number;
  text?: string;
  caption?: string;
  entities?: TgMessageEntity[];
  caption_entities?: TgMessageEntity[];
  document?: TgDocument;
  reply_to_message?: TgMessage;
}

export interface TgCallbackQuery {
  id: string;
  from: TgUser;
  message?: TgMessage;
  data?: string;
}

export interface TgUpdate {
  update_id: number;
  message?: TgMessage;
  edited_message?: TgMessage;
  callback_query?: TgCallbackQuery;
}
