/**
 * Stateless session helpers for the Telegram blog bot.
 *
 * The bot runs on Vercel serverless (no KV, no DB) but we still want
 * multi-step flows (new-post wizard, edit menus) that remember state
 * across messages.
 *
 * Trick: every bot prompt carries the full session state encoded inside
 * the URL of an HTML link with invisible anchor text. Telegram preserves
 * that link in `message.entities` on callbacks and replies. We parse the
 * state back out from there — totally invisible to the user.
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

// Custom URL scheme Telegram won't try to open, but will happily carry data.
const URL_PREFIX = "tg://stg?d=";

// Word-joiner (U+2060): zero-width, not stripped by Telegram, counts as a
// valid anchor for <a> tags. Result: the state link is invisible.
const INVISIBLE_ANCHOR = "\u2060";

interface TgEntityLike {
  type: string;
  url?: string;
}

/**
 * Encode a session into an invisible HTML link, suitable for appending to
 * any message sent with parseMode: "HTML". Users see nothing.
 */
export function encode(s: Session): string {
  const b64 = Buffer.from(JSON.stringify(s), "utf-8").toString("base64url");
  return `<a href="${URL_PREFIX}${b64}">${INVISIBLE_ANCHOR}</a>`;
}

/**
 * Pull the session out of a bot message's entity list. This is the preferred
 * path — it works with the invisible-link encoding above.
 */
export function decodeFromEntities(entities: TgEntityLike[] | undefined | null): Session | null {
  if (!entities) return null;
  for (const e of entities) {
    if ((e.type === "text_link" || e.type === "url") && e.url && e.url.startsWith(URL_PREFIX)) {
      try {
        const b64 = e.url.slice(URL_PREFIX.length);
        const json = Buffer.from(b64, "base64url").toString("utf-8");
        const parsed = JSON.parse(json);
        if (parsed && typeof parsed === "object" && typeof parsed.flow === "string") {
          return parsed as Session;
        }
      } catch {
        // fall through
      }
    }
  }
  return null;
}

/**
 * Legacy fallback: decode a session from the old "stg:<base64>" text-embedded
 * format. Keeps previously-sent messages functional after the encoding swap.
 */
export function decodeFromText(messageText: string | undefined | null): Session | null {
  if (!messageText) return null;
  const m = messageText.match(/stg:([A-Za-z0-9_-]+)/);
  if (!m) return null;
  try {
    const json = Buffer.from(m[1], "base64url").toString("utf-8");
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed === "object" && typeof parsed.flow === "string") {
      return parsed as Session;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Convenience: try both decoding strategies.
 */
export function decode(
  messageText: string | undefined | null,
  entities?: TgEntityLike[] | null,
): Session | null {
  return decodeFromEntities(entities) ?? decodeFromText(messageText);
}

/**
 * Minimal HTML-escape for user-provided content rendered with parseMode: HTML.
 */
export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
