/**
 * Telegram blog-bot — button-driven UI with a stateless state machine.
 *
 * ## UX
 * Main menu appears any time the user sends /start, /help, or any stray text
 * outside an active flow. Everything is driven by inline keyboard buttons.
 * The old slash commands (/new, /list, /view, /edit, /delete, /publish,
 * /unpublish) still work as power-user shortcuts.
 *
 * ## State
 * Multi-step flows (the /new wizard, per-post action menus) are made
 * stateless by encoding the session as a spoiler-hidden suffix on every
 * bot prompt. When the user replies or taps a button, Telegram gives us
 * back the original prompt, and we decode state from it. See lib/session.ts.
 *
 * ## Content layout
 * Posts live in:
 *   - content/posts/<slug>.mdx   — published
 *   - content/drafts/<slug>.mdx  — drafts
 * Publishing/unpublishing moves files between dirs. Setting draft: true in
 * frontmatter also hides a post from the public blog index as a safety net.
 */

import matter from "gray-matter";
import { deleteFile, getFile, listDir, writeFile, type GitHubFile } from "./github";
import { decode, encode, escapeHtml, type Session } from "./session";
import {
  answerCallbackQuery,
  downloadFile,
  editMessageText,
  sendDocument,
  sendMessage,
  type TgMessage,
} from "./telegram";

const POSTS_DIR = "content/posts";
const DRAFTS_DIR = "content/drafts";

export interface BotContext {
  chatId: number;
  message: TgMessage;
}

// ===========================================================================
// Entry points — called from app/api/telegram/route.ts
// ===========================================================================

/**
 * A plain text message arrived. Could be:
 *  - a reply to one of our wizard prompts → advance the flow
 *  - a slash command → route to the legacy command handler
 *  - anything else → show the main menu
 */
export async function handleText(ctx: BotContext, text: string): Promise<void> {
  const trimmed = text.trim();
  const replied = ctx.message.reply_to_message;
  const session = decode(replied?.text, replied?.entities);

  if (session) {
    await advanceFlow(ctx, session, { kind: "text", value: trimmed });
    return;
  }

  if (trimmed.startsWith("/")) {
    await handleCommand(ctx, trimmed);
    return;
  }

  await showMainMenu(ctx.chatId, `Hi ${ctx.message.from?.first_name ?? ""} — what would you like to do?`);
}

/**
 * A document (file upload) arrived. Could be:
 *  - a reply to an /edit prompt → replace the post wholesale
 *  - a reply to the new-wizard body step → use as post body
 *  - a standalone upload → create a new post from the file
 */
export async function handleDocument(ctx: BotContext): Promise<void> {
  const doc = ctx.message.document;
  if (!doc) return;

  if (!/\.(md|mdx|markdown|txt)$/i.test(doc.file_name ?? "")) {
    await sendMessage(ctx.chatId, "Please upload a .md or .mdx file.");
    return;
  }

  let fileContent: string;
  try {
    fileContent = await downloadFile(doc.file_id);
  } catch (err) {
    await sendMessage(ctx.chatId, `Couldn't download that file: ${errMsg(err)}`);
    return;
  }

  const replied = ctx.message.reply_to_message;
  const session = decode(replied?.text, replied?.entities);

  if (session) {
    await advanceFlow(ctx, session, { kind: "file", value: fileContent, filename: doc.file_name });
    return;
  }

  // Standalone upload — use filename as slug, content as whole post.
  const slug = slugify((doc.file_name ?? "upload").replace(/\.(md|mdx|markdown|txt)$/i, ""));
  await commitPost(ctx, {
    slug,
    rawContent: fileContent,
    existingSlug: null,
    sourceHint: `upload: ${doc.file_name}`,
  });
}

/**
 * An inline button was tapped. Always carries a session via the message it's
 * attached to.
 */
export async function handleCallback(args: {
  chatId: number;
  messageId: number;
  data: string;
  callbackQueryId: string;
  currentText: string;
  currentEntities?: import("./telegram").TgMessageEntity[];
}): Promise<void> {
  const { chatId, messageId, data, callbackQueryId, currentText, currentEntities } = args;
  const session = decode(currentText, currentEntities);

  try {
    await routeCallback({ chatId, messageId, data, session, callbackQueryId });
  } catch (err) {
    console.error("[bot] callback error", err);
    await answerCallbackQuery(callbackQueryId, "Error — check logs.");
  }
}

// ===========================================================================
// Legacy slash commands (kept as power-user shortcuts)
// ===========================================================================

async function handleCommand(ctx: BotContext, text: string): Promise<void> {
  const [rawCmd, ...rest] = text.split(/\s+/);
  const cmd = rawCmd.split("@")[0].toLowerCase();
  const arg = rest.join(" ").trim();

  switch (cmd) {
    case "/start":
    case "/menu":
      await showMainMenu(ctx.chatId);
      return;
    case "/help":
      await sendMessage(ctx.chatId, HELP_TEXT);
      await showMainMenu(ctx.chatId, "What would you like to do?");
      return;
    case "/new":
      await startNewFlow(ctx.chatId);
      return;
    case "/list":
      await showPostList(ctx.chatId, "post");
      return;
    case "/drafts":
      await showPostList(ctx.chatId, "draft");
      return;
    case "/view":
      if (arg) await sendPostFile(ctx.chatId, slugify(arg));
      else await sendMessage(ctx.chatId, "Usage: /view <slug>");
      return;
    case "/edit":
      if (arg) await openPostDetail(ctx.chatId, slugify(arg));
      else await showPostList(ctx.chatId, "post");
      return;
    case "/delete":
      if (arg) await openPostDetail(ctx.chatId, slugify(arg));
      else await showPostList(ctx.chatId, "post");
      return;
    case "/publish":
      if (arg) await movePost(ctx.chatId, slugify(arg), "publish");
      else await showPostList(ctx.chatId, "draft");
      return;
    case "/unpublish":
      if (arg) await movePost(ctx.chatId, slugify(arg), "unpublish");
      else await showPostList(ctx.chatId, "post");
      return;
    default:
      await showMainMenu(ctx.chatId, `Unknown command ${cmd}. Use the menu below:`);
  }
}

// ===========================================================================
// Main menu
// ===========================================================================

/**
 * Inline keyboard for the main menu. Re-used whenever we want to let the
 * user continue after an action without sending a second "Anything else?"
 * message.
 */
const MAIN_MENU_BUTTONS = {
  inline_keyboard: [
    [
      { text: "📝 New", callback_data: "new" },
      { text: "📋 Posts", callback_data: "list:p" },
      { text: "📄 Drafts", callback_data: "list:d" },
    ],
  ],
} as const;

async function showMainMenu(chatId: number, preamble?: string): Promise<void> {
  await sendMessage(chatId, preamble ?? "What would you like to do?", {
    parseMode: "HTML",
    replyMarkup: MAIN_MENU_BUTTONS,
  });
}

/**
 * One-shot: status line + main menu buttons in a single message so the chat
 * doesn't pile up two bubbles per action.
 */
async function sendStatusAndMenu(chatId: number, html: string): Promise<void> {
  await sendMessage(chatId, html, {
    parseMode: "HTML",
    replyMarkup: MAIN_MENU_BUTTONS,
    disablePreview: true,
  });
}

// ===========================================================================
// /new wizard — state machine
// ===========================================================================

// Ordered list of steps. Each step has a prompt renderer and an input handler.
const NEW_STEPS = ["title", "description", "date", "tags", "slug", "draft", "body", "review"] as const;
type NewStep = (typeof NEW_STEPS)[number];

async function startNewFlow(chatId: number, seed: Partial<Session> = {}): Promise<void> {
  const session: Session = { flow: "new", step: "title", ...seed };
  await promptForStep(chatId, session);
}

async function promptForStep(chatId: number, session: Session): Promise<void> {
  const step = session.step as NewStep;

  switch (step) {
    case "title":
      await sendMessage(
        chatId,
        `<b>Step 1/7 · Title</b>\nWhat's the title of your post?${encode(session)}`,
        { parseMode: "HTML", forceReply: true },
      );
      return;

    case "description":
      await sendMessage(
        chatId,
        `<b>Step 2/7 · Description</b>\nShort summary shown on the blog index.\n\n<i>Reply with text, or <code>-</code> to skip.</i>${encode(session)}`,
        { parseMode: "HTML", forceReply: true },
      );
      return;

    case "date":
      await sendMessage(
        chatId,
        `<b>Step 3/7 · Date</b>\nPublish date (YYYY-MM-DD).\n\n<i>Reply with a date, or <code>-</code> to use today (${today()}).</i>${encode(
          session,
        )}`,
        { parseMode: "HTML", forceReply: true },
      );
      return;

    case "tags":
      await sendMessage(
        chatId,
        `<b>Step 4/7 · Tags</b>\nComma-separated tags, e.g. <code>ai, security</code>.\n\n<i>Reply with tags, or <code>-</code> to skip.</i>${encode(
          session,
        )}`,
        { parseMode: "HTML", forceReply: true },
      );
      return;

    case "slug": {
      const auto = slugify(session.title ?? "");
      await sendMessage(
        chatId,
        `<b>Step 5/7 · URL slug</b>\nThis becomes /blog/<code>&lt;slug&gt;</code>.\n\n<i>Reply with a slug, or <code>-</code> to use <code>${escapeHtml(
          auto,
        )}</code>.</i>${encode(session)}`,
        { parseMode: "HTML", forceReply: true },
      );
      return;
    }

    case "draft":
      await sendMessage(
        chatId,
        `<b>Step 6/7 · Visibility</b>\nPublish now, or save as draft for later?${encode(session)}`,
        {
          parseMode: "HTML",
          replyMarkup: {
            inline_keyboard: [
              [
                { text: "🟢 Publish now", callback_data: "draft:false" },
                { text: "📄 Save as draft", callback_data: "draft:true" },
              ],
              [{ text: "✖ Cancel", callback_data: "cancel" }],
            ],
          },
        },
      );
      return;

    case "body":
      await sendMessage(
        chatId,
        `<b>Step 7/7 · Body</b>\nReply to this message with your post body in markdown, or upload a .md file.${encode(
          session,
        )}`,
        { parseMode: "HTML", forceReply: true },
      );
      return;

    case "review":
      await showReview(chatId, session);
      return;
  }
}

async function showReview(chatId: number, session: Session): Promise<void> {
  const lines = [
    "<b>Ready to save — review:</b>",
    "",
    `📌 <b>Title:</b> ${escapeHtml(session.title ?? "")}`,
    `📝 <b>Description:</b> ${escapeHtml(session.description ?? "<i>(none)</i>")}`,
    `📅 <b>Date:</b> ${escapeHtml(session.date ?? today())}`,
    `🏷️ <b>Tags:</b> ${escapeHtml(session.tags ?? "<i>(none)</i>")}`,
    `🔗 <b>Slug:</b> <code>${escapeHtml(session.postSlug ?? slugify(session.title ?? ""))}</code>`,
    `📣 <b>Status:</b> ${session.draft ? "Draft" : "Published"}`,
  ];
  await sendMessage(chatId, lines.join("\n") + encode(session), {
    parseMode: "HTML",
    replyMarkup: {
      inline_keyboard: [
        [{ text: session.draft ? "📄 Save draft" : "🟢 Publish", callback_data: "save" }],
        [{ text: "✖ Cancel", callback_data: "cancel" }],
      ],
    },
  });
}

/**
 * Handle an input arriving during an active flow.
 */
async function advanceFlow(
  ctx: BotContext,
  session: Session,
  input: { kind: "text"; value: string } | { kind: "file"; value: string; filename?: string },
): Promise<void> {
  // Global cancel shortcut.
  if (input.kind === "text" && input.value.toLowerCase() === "cancel") {
    await showMainMenu(ctx.chatId, "Cancelled.");
    return;
  }

  if (session.flow === "new") {
    await advanceNewFlow(ctx, session, input);
    return;
  }

  if (session.flow === "editBody" && session.slug) {
    // User is replacing a post's body. File or text both work.
    await saveBodyOnly(ctx, session.slug, input.value);
    return;
  }

  if (session.flow === "edit" && session.slug && session.step) {
    // User is editing a specific field of an existing post.
    await saveSingleField(ctx, session.slug, session.step, input.value);
    return;
  }

  // Fallback.
  await showMainMenu(ctx.chatId, "Not sure what to do with that — back to the menu.");
}

async function advanceNewFlow(
  ctx: BotContext,
  session: Session,
  input: { kind: "text"; value: string } | { kind: "file"; value: string; filename?: string },
): Promise<void> {
  const step = session.step as NewStep;

  // Body step accepts a file OR text directly.
  if (step === "body") {
    if (input.kind === "file") {
      // If the uploaded file contains its own frontmatter, assume it's a
      // whole-post replacement — commit straight from the file.
      const maybeMatter = tryMatter(input.value);
      if (maybeMatter && maybeMatter.data.title) {
        const slug = slugify(String(maybeMatter.data.slug || session.postSlug || session.title || ""));
        await commitPost(ctx, {
          slug,
          rawContent: input.value,
          existingSlug: null,
          sourceHint: input.filename ?? "file",
        });
        return;
      }
    }
    session.step = "review";
    await commitNewFromSession(ctx, session, input.value);
    return;
  }

  if (input.kind === "file") {
    // Files are only meaningful at the body step.
    await sendMessage(ctx.chatId, "File uploads work at the body step. Please reply with text.");
    return;
  }

  const value = input.value;
  const skipped = value === "-" || value === "";

  switch (step) {
    case "title":
      if (skipped) {
        await sendMessage(ctx.chatId, "Title is required. Try again or send <code>cancel</code>.", {
          parseMode: "HTML",
        });
        await promptForStep(ctx.chatId, session);
        return;
      }
      session.title = value;
      session.step = "description";
      break;

    case "description":
      if (!skipped) session.description = value;
      session.step = "date";
      break;

    case "date":
      if (!skipped) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          await sendMessage(ctx.chatId, "Please use YYYY-MM-DD format.");
          await promptForStep(ctx.chatId, session);
          return;
        }
        session.date = value;
      }
      session.step = "tags";
      break;

    case "tags":
      if (!skipped) session.tags = value;
      session.step = "slug";
      break;

    case "slug":
      if (!skipped) session.postSlug = slugify(value);
      session.step = "draft";
      break;
  }

  await promptForStep(ctx.chatId, session);
}

/**
 * Final step: build the MDX from the wizard state and commit it.
 */
async function commitNewFromSession(ctx: BotContext, session: Session, body: string): Promise<void> {
  const frontmatter: Record<string, unknown> = {
    title: session.title,
    ...(session.description ? { description: session.description } : {}),
    date: session.date || today(),
    ...(session.tags
      ? {
          tags: session.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }
      : {}),
    ...(session.draft ? { draft: true } : {}),
  };
  const slug = session.postSlug || slugify(session.title ?? "");
  const content = matter.stringify(body.trim() + "\n", frontmatter);

  await commitPost(ctx, {
    slug,
    rawContent: content,
    existingSlug: null,
    sourceHint: "wizard",
  });
}

// ===========================================================================
// Post list + detail
// ===========================================================================

async function showPostList(chatId: number, kind: "post" | "draft"): Promise<void> {
  const posts = await listPosts(kind === "post" ? POSTS_DIR : DRAFTS_DIR);

  if (posts.length === 0) {
    await sendMessage(
      chatId,
      kind === "post" ? "No published posts yet." : "No drafts yet.",
      {
        replyMarkup: {
          inline_keyboard: [
            [{ text: "📝 New post", callback_data: "new" }],
            [{ text: "← Menu", callback_data: "menu" }],
          ],
        },
      },
    );
    return;
  }

  const rows = posts.slice(0, 40).map((p) => [
    { text: p.slug, callback_data: `post:${kind[0]}:${p.slug}` },
  ]);
  rows.push([
    { text: kind === "post" ? "📄 Show drafts" : "📋 Show published", callback_data: kind === "post" ? "list:d" : "list:p" },
    { text: "← Menu", callback_data: "menu" },
  ]);

  const label = kind === "post" ? "Published posts" : "Drafts";
  await sendMessage(chatId, `<b>${label}</b> (${posts.length}) — tap one:`, {
    parseMode: "HTML",
    replyMarkup: { inline_keyboard: rows },
  });
}

async function openPostDetail(chatId: number, slug: string, preamble = ""): Promise<void> {
  const post = await findPost(slug);
  if (!post) {
    await sendMessage(chatId, `No post "${slug}".`);
    return;
  }

  const front = matter(post.content).data;
  const lines = [
    preamble + `<b>${escapeHtml(String(front.title ?? slug))}</b>`,
    `<code>${escapeHtml(slug)}</code> · ${post.kind === "draft" ? "📄 draft" : "🟢 published"}`,
    front.date ? `📅 ${escapeHtml(String(front.date))}` : "",
    front.description ? `\n${escapeHtml(String(front.description))}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const kindChar = post.kind === "draft" ? "d" : "p";
  const publishToggle =
    post.kind === "draft"
      ? { text: "🟢 Publish", callback_data: `pub:${slug}` }
      : { text: "📄 Unpublish", callback_data: `unpub:${slug}` };

  await sendMessage(chatId, lines, {
    parseMode: "HTML",
    replyMarkup: {
      inline_keyboard: [
        [
          { text: "👁 View", callback_data: `view:${kindChar}:${slug}` },
          { text: "✏️ Edit", callback_data: `edit:${slug}` },
        ],
        [publishToggle, { text: "🗑 Delete", callback_data: `del:${kindChar}:${slug}` }],
        [{ text: "← Back", callback_data: `list:${kindChar}` }],
      ],
    },
  });
}

async function sendPostFile(chatId: number, slug: string): Promise<void> {
  const post = await findPost(slug);
  if (!post) {
    await sendMessage(chatId, `No post "${slug}".`);
    return;
  }
  await sendDocument(
    chatId,
    `${slug}.mdx`,
    post.content,
    post.kind === "draft" ? "(draft)" : "(published)",
  );
}

// ===========================================================================
// Edit menus
// ===========================================================================

async function openEditMenu(chatId: number, slug: string): Promise<void> {
  const post = await findPost(slug);
  if (!post) {
    await sendMessage(chatId, `No post "${slug}".`);
    return;
  }
  const front = matter(post.content).data;
  const lines = [
    `<b>Editing</b> <code>${escapeHtml(slug)}</code>`,
    "",
    `📌 Title: ${escapeHtml(String(front.title ?? ""))}`,
    `📝 Description: ${escapeHtml(String(front.description ?? "(none)"))}`,
    `📅 Date: ${escapeHtml(String(front.date ?? ""))}`,
    `🏷️ Tags: ${escapeHtml(Array.isArray(front.tags) ? front.tags.join(", ") : String(front.tags ?? "(none)"))}`,
    `📣 Status: ${front.draft ? "Draft" : "Published"}`,
    "",
    "Tap a field to edit:",
  ];
  await sendMessage(chatId, lines.join("\n"), {
    parseMode: "HTML",
    replyMarkup: {
      inline_keyboard: [
        [
          { text: "📌 Title", callback_data: `ef:${slug}:title` },
          { text: "📝 Description", callback_data: `ef:${slug}:description` },
        ],
        [
          { text: "📅 Date", callback_data: `ef:${slug}:date` },
          { text: "🏷️ Tags", callback_data: `ef:${slug}:tags` },
        ],
        [{ text: "📄 Replace body", callback_data: `eb:${slug}` }],
        [{ text: "← Back to post", callback_data: `openPost:${slug}` }],
      ],
    },
  });
}

async function promptEditField(chatId: number, slug: string, field: string): Promise<void> {
  const post = await findPost(slug);
  if (!post) {
    await sendMessage(chatId, `No post "${slug}".`);
    return;
  }
  const front = matter(post.content).data;
  const current = Array.isArray(front[field]) ? (front[field] as unknown[]).join(", ") : String(front[field] ?? "");
  const session: Session = { flow: "edit", slug, step: field, editing: true };
  await sendMessage(
    chatId,
    `<b>Editing ${escapeHtml(field)}</b> of <code>${escapeHtml(slug)}</code>\nCurrent: <code>${escapeHtml(current || "(empty)")}</code>\n\nReply with the new value, or <code>-</code> to clear it.${encode(
      session,
    )}`,
    { parseMode: "HTML", forceReply: true },
  );
}

async function promptEditBody(chatId: number, slug: string): Promise<void> {
  const post = await findPost(slug);
  if (!post) {
    await sendMessage(chatId, `No post "${slug}".`);
    return;
  }
  const parsed = matter(post.content);
  await sendDocument(chatId, `${slug}.mdx`, parsed.content, "Current body (no frontmatter)");
  const session: Session = { flow: "editBody", slug };
  await sendMessage(
    chatId,
    `Reply to this message with the new body (plain markdown), or upload a .md file. Frontmatter is preserved.${encode(
      session,
    )}`,
    { parseMode: "HTML", forceReply: true },
  );
}

async function saveSingleField(
  ctx: BotContext,
  slug: string,
  field: string,
  value: string,
): Promise<void> {
  const path = await findPostPath(slug);
  if (!path) {
    await sendMessage(ctx.chatId, `Post "${slug}" vanished.`);
    return;
  }
  const existing = await getFile(path);
  if (!existing) {
    await sendMessage(ctx.chatId, `Post "${slug}" vanished.`);
    return;
  }
  const parsed = matter(existing.content);

  const cleared = value === "-" || value === "";
  if (field === "tags") {
    parsed.data.tags = cleared
      ? []
      : value
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);
  } else if (field === "date") {
    if (!cleared && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      await sendMessage(ctx.chatId, "Please use YYYY-MM-DD.");
      return;
    }
    parsed.data.date = cleared ? today() : value;
  } else {
    parsed.data[field] = cleared ? undefined : value;
  }

  const newContent = matter.stringify(parsed.content, parsed.data);
  await writeFile({
    path,
    content: newContent,
    message: `docs(blog): edit ${field} of ${slug} via telegram bot`,
    sha: existing.sha,
  });
  await sendMessage(ctx.chatId, `✅ Updated <b>${escapeHtml(field)}</b> on <code>${escapeHtml(slug)}</code>.`, {
    parseMode: "HTML",
  });
  await openEditMenu(ctx.chatId, slug);
}

async function saveBodyOnly(ctx: BotContext, slug: string, body: string): Promise<void> {
  const path = await findPostPath(slug);
  if (!path) {
    await sendMessage(ctx.chatId, `Post "${slug}" vanished.`);
    return;
  }
  const existing = await getFile(path);
  if (!existing) return;
  const parsed = matter(existing.content);

  // If the new body starts with its own frontmatter, strip that and keep the original.
  const incoming = tryMatter(body);
  const newBody = incoming ? incoming.content : body;

  const newContent = matter.stringify(newBody.trim() + "\n", parsed.data);
  await writeFile({
    path,
    content: newContent,
    message: `docs(blog): replace body of ${slug} via telegram bot`,
    sha: existing.sha,
  });
  await sendMessage(ctx.chatId, `✅ Body updated for <code>${escapeHtml(slug)}</code>.`, {
    parseMode: "HTML",
  });
  await openEditMenu(ctx.chatId, slug);
}

// ===========================================================================
// Commit / move / delete
// ===========================================================================

async function commitPost(
  ctx: BotContext,
  args: { slug: string; rawContent: string; existingSlug: string | null; sourceHint: string },
): Promise<void> {
  let slug = slugify(args.slug);
  if (!slug) {
    await sendMessage(ctx.chatId, "I couldn't figure out a slug for this post.");
    return;
  }

  let parsed: matter.GrayMatterFile<string>;
  try {
    parsed = matter(args.rawContent);
  } catch (err) {
    await sendMessage(ctx.chatId, `Frontmatter parse error: ${errMsg(err)}`);
    return;
  }

  if (!parsed.data || Object.keys(parsed.data).length === 0) {
    await sendMessage(
      ctx.chatId,
      "That file is missing frontmatter. It must start with a --- block containing at least a title.",
    );
    return;
  }
  if (!parsed.data.title) {
    await sendMessage(ctx.chatId, "Frontmatter must include `title`.");
    return;
  }
  if (!parsed.data.date) parsed.data.date = today();

  if (Array.isArray(parsed.data.tags)) {
    parsed.data.tags = parsed.data.tags.map((t) => String(t).trim()).filter(Boolean);
  } else if (typeof parsed.data.tags === "string") {
    parsed.data.tags = parsed.data.tags.split(",").map((t) => t.trim()).filter(Boolean);
  }

  if (parsed.data.slug) {
    slug = slugify(String(parsed.data.slug));
    delete parsed.data.slug;
  }

  const isDraft =
    parsed.data.draft === true || String(parsed.data.draft).toLowerCase() === "true";
  const dir = isDraft ? DRAFTS_DIR : POSTS_DIR;
  const otherDir = isDraft ? POSTS_DIR : DRAFTS_DIR;
  const path = `${dir}/${slug}.mdx`;
  const finalContent = matter.stringify(parsed.content, parsed.data);

  try {
    // If the post exists under the other classification, remove it so we
    // don't end up with two copies.
    const other = await getFile(`${otherDir}/${slug}.mdx`);
    if (other) {
      await deleteFile({
        path: `${otherDir}/${slug}.mdx`,
        sha: other.sha,
        message: `chore(blog): move ${slug} between draft/published via telegram bot`,
      });
    }

    const existing = await getFile(path);
    await writeFile({
      path,
      content: finalContent,
      message: `${existing ? "docs(blog): update" : "docs(blog): add"} ${slug} via telegram bot`,
      sha: existing?.sha,
    });

    const url = `https://github.com/${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}/blob/${
      process.env.GITHUB_BRANCH || "main"
    }/${path}`;
    const status = isDraft ? "📄 Saved as draft" : "🟢 Published";
    await sendStatusAndMenu(
      ctx.chatId,
      `${status}: <code>${escapeHtml(slug)}</code> · <a href="${url}">view on GitHub</a>`,
    );
  } catch (err) {
    await sendMessage(ctx.chatId, `Save failed: ${errMsg(err)}`);
  }
}

async function movePost(
  chatId: number,
  slug: string,
  mode: "publish" | "unpublish",
): Promise<void> {
  const from = mode === "publish" ? `${DRAFTS_DIR}/${slug}.mdx` : `${POSTS_DIR}/${slug}.mdx`;
  const to = mode === "publish" ? `${POSTS_DIR}/${slug}.mdx` : `${DRAFTS_DIR}/${slug}.mdx`;
  const src = await getFile(from);
  if (!src) {
    await sendMessage(chatId, `No ${mode === "publish" ? "draft" : "published post"} named "${slug}".`);
    return;
  }
  const parsed = matter(src.content);
  parsed.data.draft = mode === "unpublish";
  const newContent = matter.stringify(parsed.content, parsed.data);
  await writeFile({
    path: to,
    content: newContent,
    message: `chore(blog): ${mode} ${slug} via telegram bot`,
  });
  await deleteFile({
    path: from,
    sha: src.sha,
    message: `chore(blog): ${mode} ${slug} (remove source) via telegram bot`,
  });
  await openPostDetail(
    chatId,
    slug,
    mode === "publish"
      ? `🟢 Published: <code>${escapeHtml(slug)}</code>\n\n`
      : `📄 Moved to drafts: <code>${escapeHtml(slug)}</code>\n\n`,
  );
}

async function confirmDelete(chatId: number, slug: string, kind: "post" | "draft"): Promise<void> {
  const dir = kind === "draft" ? DRAFTS_DIR : POSTS_DIR;
  const path = `${dir}/${slug}.mdx`;
  const file = await getFile(path);
  if (!file) {
    await sendMessage(chatId, `No post "${slug}".`);
    return;
  }
  await deleteFile({
    path,
    sha: file.sha,
    message: `chore(blog): delete ${slug} via telegram bot`,
  });
  await sendStatusAndMenu(chatId, `🗑 Deleted <code>${escapeHtml(slug)}</code>.`);
}

// ===========================================================================
// Callback routing
// ===========================================================================

async function routeCallback(args: {
  chatId: number;
  messageId: number;
  data: string;
  session: Session | null;
  callbackQueryId: string;
}): Promise<void> {
  const { chatId, messageId, data, session, callbackQueryId } = args;

  // Global actions first.
  if (data === "menu") {
    await answerCallbackQuery(callbackQueryId);
    await showMainMenu(chatId);
    return;
  }
  if (data === "help") {
    await answerCallbackQuery(callbackQueryId);
    await sendMessage(chatId, HELP_TEXT);
    return;
  }
  if (data === "new") {
    await answerCallbackQuery(callbackQueryId);
    await startNewFlow(chatId);
    return;
  }
  if (data === "cancel") {
    await answerCallbackQuery(callbackQueryId, "Cancelled");
    await editMessageText(chatId, messageId, "✖ Cancelled.");
    return;
  }

  // List views.
  if (data === "list:p") {
    await answerCallbackQuery(callbackQueryId);
    await showPostList(chatId, "post");
    return;
  }
  if (data === "list:d") {
    await answerCallbackQuery(callbackQueryId);
    await showPostList(chatId, "draft");
    return;
  }

  // Post detail. Format: post:<kind char>:<slug>
  if (data.startsWith("post:")) {
    const parts = data.split(":");
    const slug = parts.slice(2).join(":");
    await answerCallbackQuery(callbackQueryId);
    await openPostDetail(chatId, slug);
    return;
  }
  if (data.startsWith("openPost:")) {
    const slug = data.slice("openPost:".length);
    await answerCallbackQuery(callbackQueryId);
    await openPostDetail(chatId, slug);
    return;
  }

  // View (send file). Format: view:<kind>:<slug>
  if (data.startsWith("view:")) {
    const parts = data.split(":");
    const slug = parts.slice(2).join(":");
    await answerCallbackQuery(callbackQueryId);
    await sendPostFile(chatId, slug);
    return;
  }

  // Edit menu and field editing.
  if (data.startsWith("edit:")) {
    const slug = data.slice("edit:".length);
    await answerCallbackQuery(callbackQueryId);
    await openEditMenu(chatId, slug);
    return;
  }
  if (data.startsWith("ef:")) {
    // ef:<slug>:<field>
    const rest = data.slice("ef:".length);
    const idx = rest.lastIndexOf(":");
    if (idx > 0) {
      const slug = rest.slice(0, idx);
      const field = rest.slice(idx + 1);
      await answerCallbackQuery(callbackQueryId);
      await promptEditField(chatId, slug, field);
    }
    return;
  }
  if (data.startsWith("eb:")) {
    const slug = data.slice("eb:".length);
    await answerCallbackQuery(callbackQueryId);
    await promptEditBody(chatId, slug);
    return;
  }

  // Publish / unpublish.
  if (data.startsWith("pub:")) {
    const slug = data.slice("pub:".length);
    await answerCallbackQuery(callbackQueryId, "Publishing…");
    await movePost(chatId, slug, "publish");
    return;
  }
  if (data.startsWith("unpub:")) {
    const slug = data.slice("unpub:".length);
    await answerCallbackQuery(callbackQueryId, "Unpublishing…");
    await movePost(chatId, slug, "unpublish");
    return;
  }

  // Delete flow. del:<kindChar>:<slug>  then delConfirm:<kindChar>:<slug>
  if (data.startsWith("del:")) {
    const parts = data.split(":");
    const kindChar = parts[1];
    const slug = parts.slice(2).join(":");
    const kind = kindChar === "d" ? "draft" : "post";
    await answerCallbackQuery(callbackQueryId);
    await sendMessage(chatId, `Delete <code>${escapeHtml(slug)}</code>? This is permanent.`, {
      parseMode: "HTML",
      replyMarkup: {
        inline_keyboard: [
          [
            { text: "Yes, delete", callback_data: `delConfirm:${kindChar}:${slug}` },
            { text: "Cancel", callback_data: `post:${kindChar}:${slug}` },
          ],
        ],
      },
    });
    return;
  }
  if (data.startsWith("delConfirm:")) {
    const parts = data.split(":");
    const kindChar = parts[1];
    const slug = parts.slice(2).join(":");
    const kind = kindChar === "d" ? "draft" : "post";
    await answerCallbackQuery(callbackQueryId, "Deleting…");
    await confirmDelete(chatId, slug, kind);
    return;
  }

  // New-wizard draft toggle.
  if (data.startsWith("draft:") && session && session.flow === "new") {
    session.draft = data === "draft:true";
    session.step = "body";
    await answerCallbackQuery(callbackQueryId);
    await promptForStep(chatId, session);
    return;
  }

  // Finalize new flow (only reachable from body step's explicit save path,
  // which we don't expose directly — body text/file triggers commit.)
  if (data === "save" && session) {
    await answerCallbackQuery(callbackQueryId, "Saving…");
    // Review-stage save means the body should already be in session... but
    // to keep the session small, we don't store body. Treat save as "use
    // empty body" if it ever gets here.
    return;
  }

  await answerCallbackQuery(callbackQueryId);
}

// ===========================================================================
// Helpers
// ===========================================================================

interface PostSummary {
  slug: string;
  path: string;
}

async function listPosts(dir: string): Promise<PostSummary[]> {
  const entries: GitHubFile[] = await listDir(dir);
  return entries
    .filter((e) => e.type === "file" && /\.mdx?$/.test(e.name))
    .map((e) => ({ slug: e.name.replace(/\.mdx?$/, ""), path: e.path }))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

async function findPost(slug: string): Promise<{ content: string; kind: "post" | "draft" } | null> {
  const [pub, draft] = await Promise.all([
    getFile(`${POSTS_DIR}/${slug}.mdx`),
    getFile(`${DRAFTS_DIR}/${slug}.mdx`),
  ]);
  if (pub) return { content: pub.content, kind: "post" };
  if (draft) return { content: draft.content, kind: "draft" };
  return null;
}

async function findPostPath(slug: string): Promise<string | null> {
  const [pub, draft] = await Promise.all([
    getFile(`${POSTS_DIR}/${slug}.mdx`),
    getFile(`${DRAFTS_DIR}/${slug}.mdx`),
  ]);
  if (pub) return `${POSTS_DIR}/${slug}.mdx`;
  if (draft) return `${DRAFTS_DIR}/${slug}.mdx`;
  return null;
}

function tryMatter(raw: string): matter.GrayMatterFile<string> | null {
  try {
    const p = matter(raw);
    if (!p.data || Object.keys(p.data).length === 0) return null;
    return p;
  } catch {
    return null;
  }
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

const HELP_TEXT = `Jeet's blog bot

Tap buttons — no commands needed. Main menu gives you:
 • 📝 New post — guided wizard, skip any optional with "-"
 • 📋 Posts — list published posts, tap one to view/edit/delete/unpublish
 • 📄 Drafts — same, for drafts

Power-user shortcuts (still work): /new, /list, /drafts, /view <slug>,
/edit <slug>, /delete <slug>, /publish <slug>, /unpublish <slug>, /menu.

You can also just upload a .md or .mdx file at any time — I'll treat
the filename as the slug and commit it.`;
