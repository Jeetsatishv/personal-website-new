/**
 * Stateless session helpers for the Telegram blog bot.
 *
 * The bot runs on Vercel serverless functions with no KV/DB. We still want
 * multi-step flows (new-post wizard, edit menus, etc.) that remember state
 * across messages.
 *
 * Trick: every bot prompt carries the full session state encoded in its
 * own message text, hidden inside a <tg-spoiler> block. When the user
 * replies to that prompt (or taps a button on it), Telegram delivers the
 * original message back to us via `reply_to_message.text` or
 * `callback_query.message.text`. We pull the state out with a regex.
 *
 * Result: zero external storage, zero infra. Session survives forever
 * (until the user deletes the bot's message).
 */

export type FlowKind = "new" | "edit" | "delete" | "menu" | "list" | "editBody";

export interface Session {
  /** Which flow the user is in. */
  flow: FlowKind;
  /** Step within the flow. */
  step?: string;
  /** For edit/delete flows — which post we're targeting. */
  slug?: string;
  /** Kind of post when deleting (published vs draft folder). */
  kind?: "post" | "draft";
  /** Whether edit mode — on commit, preserve existing body / merge fields. */
  editing?: boolean;

  // Draft post being composed (all optional, filled in as the wizard progresses).
  title?: string;
  description?: string;
  date?: string;
  tags?: string;
  postSlug?: string;
  draft?: boolean;
}

// Distinctive marker so we don't confuse random "s:xxx" text for session data.
const MARKER = "stg:";

/**
 * Encode a session into a blurred spoiler suffix. Use with parseMode: "HTML".
 */
export function encode(s: Session): string {
  const b64 = Buffer.from(JSON.stringify(s), "utf-8").toString("base64url");
  return `\n\n<tg-spoiler>${MARKER}${b64}</tg-spoiler>`;
}

/**
 * Pull the session back out of a bot message. Telegram strips the HTML
 * tags from `text` but preserves the underlying characters, so "stg:..."
 * survives verbatim.
 */
export function decode(messageText: string | undefined | null): Session | null {
  if (!messageText) return null;
  const m = messageText.match(/stg:([A-Za-z0-9_-]+)/);
  if (!m) return null;
  try {
    const json = Buffer.from(m[1], "base64url").toString("utf-8");
    const parsed = JSON.parse(json);
    if (typeof parsed === "object" && parsed && typeof parsed.flow === "string") {
      return parsed as Session;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Minimal HTML-escape for user-provided content rendered with parseMode: HTML.
 */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
