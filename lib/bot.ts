/**
 * Telegram blog-bot command handlers.
 *
 * Design notes:
 * - Stateless. Every command is self-contained. Multi-step flows are handled
 *   via the "reply to a bot message" pattern (checked in route.ts) plus
 *   file uploads, so we don't need a KV store.
 * - Posts live in `content/posts/`. A post with frontmatter `draft: true`
 *   (or anything starting with `_`) is hidden from the public blog index.
 *   We also treat files under `content/drafts/` as drafts for convenience,
 *   so the publish/unpublish flow just moves files between dirs.
 */

import matter from "gray-matter";
import {
  deleteFile,
  getFile,
  listDir,
  writeFile,
  type GitHubFile,
} from "./github";
import {
  downloadFile,
  sendDocument,
  sendMessage,
  type TgMessage,
} from "./telegram";

const POSTS_DIR = "content/posts";
const DRAFTS_DIR = "content/drafts";

const HELP_TEXT = `Jeet's blog bot

COMMANDS
  /list              list published posts
  /drafts            list draft posts
  /view <slug>       send the post as a markdown file
  /new               create a new post (see below)
  /edit <slug>       edit an existing post
  /delete <slug>     delete a post (with confirmation)
  /publish <slug>    move a draft to published
  /unpublish <slug>  move a published post to drafts
  /help              this message

CREATING A POST — OPTION 1: upload a .md or .mdx file
  Filename (without extension) becomes the slug. File must start with
  frontmatter, e.g.:

  ---
  title: "My post title"
  description: "Short summary"
  date: "2026-04-23"
  tags: ["ai", "security"]
  draft: false
  ---

  Post body in markdown.

CREATING A POST — OPTION 2: /new command
  Send /new followed by the post, like so:

  /new
  title: My post title
  description: Short summary
  date: 2026-04-23
  tags: ai, security
  slug: optional-custom-slug
  draft: false
  ---
  Post body in markdown.

Only "title" is required. Date defaults to today, slug is generated from
the title, draft defaults to false.

EDITING
  /edit <slug>  → I'll send you the current MDX. Reply to my prompt with
  either a new markdown file upload or a plain-text message in the same
  frontmatter+body format. The slug is kept.`;

export interface BotContext {
  chatId: number;
  message: TgMessage;
}

// ---- Public dispatcher ----------------------------------------------------

export async function handleCommand(ctx: BotContext, text: string): Promise<void> {
  const trimmed = text.trim();

  // /new can be single-line ("/new") or include the post inline on the same
  // or following lines, so match loosely.
  if (/^\/new(\s|$)/.test(trimmed)) {
    await handleNew(ctx, stripCommand(trimmed, "/new"));
    return;
  }

  const [rawCmd, ...rest] = trimmed.split(/\s+/);
  const cmd = rawCmd.split("@")[0].toLowerCase();
  const arg = rest.join(" ").trim();

  switch (cmd) {
    case "/start":
    case "/help":
      await sendMessage(ctx.chatId, HELP_TEXT);
      return;
    case "/list":
      await handleList(ctx, false);
      return;
    case "/drafts":
      await handleList(ctx, true);
      return;
    case "/view":
      await handleView(ctx, arg);
      return;
    case "/edit":
      await handleEdit(ctx, arg);
      return;
    case "/delete":
      await handleDelete(ctx, arg);
      return;
    case "/publish":
      await handleMove(ctx, arg, "publish");
      return;
    case "/unpublish":
      await handleMove(ctx, arg, "unpublish");
      return;
    default:
      // Not a recognized command. If this looks like a reply to an /edit
      // prompt, route.ts handles it before reaching here.
      await sendMessage(
        ctx.chatId,
        `Unknown command: ${cmd}. Send /help to see what I understand.`,
      );
  }
}

/**
 * Handle a document upload. The filename (without extension) becomes the
 * slug; the file must contain valid frontmatter.
 */
export async function handleDocument(ctx: BotContext): Promise<void> {
  const doc = ctx.message.document;
  if (!doc) return;

  const name = doc.file_name ?? "upload.md";
  if (!/\.(md|mdx|markdown|txt)$/i.test(name)) {
    await sendMessage(
      ctx.chatId,
      "That file doesn't look like markdown. Please upload a `.md` or `.mdx` file.",
    );
    return;
  }

  let content: string;
  try {
    content = await downloadFile(doc.file_id);
  } catch (err) {
    await sendMessage(ctx.chatId, `Failed to download file: ${errMsg(err)}`);
    return;
  }

  // If this upload is a reply to an /edit prompt, use the slug we asked about
  // instead of the filename.
  const replyText = ctx.message.reply_to_message?.text ?? "";
  const editSlug = extractSlugFromEditPrompt(replyText);
  const slug = editSlug ?? slugify(name.replace(/\.(md|mdx|markdown|txt)$/i, ""));

  await upsertPost(ctx, { slug, rawContent: content, sourceHint: name });
}

// ---- Command handlers -----------------------------------------------------

async function handleList(ctx: BotContext, draftsOnly: boolean): Promise<void> {
  const [published, drafts] = await Promise.all([
    listPosts(POSTS_DIR),
    listPosts(DRAFTS_DIR),
  ]);

  if (draftsOnly) {
    if (drafts.length === 0) {
      await sendMessage(ctx.chatId, "No drafts.");
      return;
    }
    const lines = drafts.map((p) => `• ${p.slug}`);
    await sendMessage(ctx.chatId, `Drafts (${drafts.length})\n${lines.join("\n")}`);
    return;
  }

  const lines: string[] = [];
  if (published.length > 0) {
    lines.push(`Published (${published.length})`);
    for (const p of published) lines.push(`• ${p.slug}`);
  }
  if (drafts.length > 0) {
    if (lines.length) lines.push("");
    lines.push(`Drafts (${drafts.length})`);
    for (const p of drafts) lines.push(`• ${p.slug}`);
  }
  if (lines.length === 0) {
    await sendMessage(ctx.chatId, "No posts yet. Send /new or upload a markdown file.");
    return;
  }
  await sendMessage(ctx.chatId, lines.join("\n"));
}

async function handleView(ctx: BotContext, slug: string): Promise<void> {
  if (!slug) {
    await sendMessage(ctx.chatId, "Usage: /view <slug>");
    return;
  }
  const cleanSlug = normalizeSlug(slug);
  const found = await findPost(cleanSlug);
  if (!found) {
    await sendMessage(ctx.chatId, `No post with slug "${cleanSlug}".`);
    return;
  }
  await sendDocument(
    ctx.chatId,
    `${cleanSlug}.mdx`,
    found.content,
    found.kind === "draft" ? "(draft)" : "(published)",
  );
}

async function handleEdit(ctx: BotContext, slug: string): Promise<void> {
  if (!slug) {
    await sendMessage(ctx.chatId, "Usage: /edit <slug>");
    return;
  }
  const cleanSlug = normalizeSlug(slug);
  const found = await findPost(cleanSlug);
  if (!found) {
    await sendMessage(ctx.chatId, `No post with slug "${cleanSlug}".`);
    return;
  }
  await sendDocument(ctx.chatId, `${cleanSlug}.mdx`, found.content);
  await sendMessage(
    ctx.chatId,
    `Editing \`${cleanSlug}\`. Reply to THIS message with the new content — either as a markdown file upload, or a plain-text message in the same frontmatter + body format. The slug will be kept.`,
    { parseMode: "Markdown" },
  );
}

async function handleDelete(ctx: BotContext, slug: string): Promise<void> {
  if (!slug) {
    await sendMessage(ctx.chatId, "Usage: /delete <slug>");
    return;
  }
  const cleanSlug = normalizeSlug(slug);
  const found = await findPost(cleanSlug);
  if (!found) {
    await sendMessage(ctx.chatId, `No post with slug "${cleanSlug}".`);
    return;
  }
  await sendMessage(
    ctx.chatId,
    `About to delete "${cleanSlug}" (${found.kind}). Tap a button to confirm.`,
    {
      replyMarkup: {
        inline_keyboard: [
          [
            { text: "Yes, delete", callback_data: `del:${cleanSlug}:${found.kind}` },
            { text: "Cancel", callback_data: "cancel" },
          ],
        ],
      },
    },
  );
}

export async function confirmDelete(
  chatId: number,
  slug: string,
  kind: "post" | "draft",
): Promise<string> {
  const dir = kind === "draft" ? DRAFTS_DIR : POSTS_DIR;
  const path = `${dir}/${slug}.mdx`;
  const file = await getFile(path);
  if (!file) return `Already gone: \`${slug}\``;
  await deleteFile({
    path,
    sha: file.sha,
    message: `chore(blog): delete ${slug} via telegram bot`,
  });
  return `Deleted \`${slug}\`. Vercel is redeploying.`;
}

async function handleMove(
  ctx: BotContext,
  slug: string,
  mode: "publish" | "unpublish",
): Promise<void> {
  if (!slug) {
    await sendMessage(ctx.chatId, `Usage: /${mode} <slug>`);
    return;
  }
  const cleanSlug = normalizeSlug(slug);
  const from = mode === "publish" ? `${DRAFTS_DIR}/${cleanSlug}.mdx` : `${POSTS_DIR}/${cleanSlug}.mdx`;
  const to = mode === "publish" ? `${POSTS_DIR}/${cleanSlug}.mdx` : `${DRAFTS_DIR}/${cleanSlug}.mdx`;

  const src = await getFile(from);
  if (!src) {
    await sendMessage(
      ctx.chatId,
      `No ${mode === "publish" ? "draft" : "published post"} with slug "${cleanSlug}".`,
    );
    return;
  }

  // Flip the `draft` frontmatter flag so it matches the folder.
  const parsed = matter(src.content);
  parsed.data.draft = mode === "unpublish";
  const newContent = matter.stringify(parsed.content, parsed.data);

  try {
    await writeFile({
      path: to,
      content: newContent,
      message: `chore(blog): ${mode} ${cleanSlug} via telegram bot`,
    });
    await deleteFile({
      path: from,
      sha: src.sha,
      message: `chore(blog): ${mode} ${cleanSlug} (remove source) via telegram bot`,
    });
    await sendMessage(
      ctx.chatId,
      `${mode === "publish" ? "Published" : "Moved to drafts"}: \`${cleanSlug}\`. Vercel is redeploying.`,
      { parseMode: "Markdown" },
    );
  } catch (err) {
    await sendMessage(ctx.chatId, `Failed: ${errMsg(err)}`);
  }
}

async function handleNew(ctx: BotContext, body: string): Promise<void> {
  if (!body.trim()) {
    await sendMessage(
      ctx.chatId,
      "Send `/new` followed by the post. See /help for the exact format, or just upload a `.md` file.",
      { parseMode: "Markdown" },
    );
    return;
  }

  // /new can be followed by either (a) a simple "key: value" preamble with
  // body after a --- separator, or (b) a raw markdown file with frontmatter.
  const raw = normalizeNewInput(body);

  const parsed = tryParseFrontmatter(raw);
  if (!parsed) {
    await sendMessage(
      ctx.chatId,
      "I couldn't parse a title from that. Please include `title:` at minimum. Send /help for the format.",
      { parseMode: "Markdown" },
    );
    return;
  }

  if (!parsed.data.title) {
    await sendMessage(ctx.chatId, "`title` is required.", { parseMode: "Markdown" });
    return;
  }

  const slug = String(parsed.data.slug || slugify(String(parsed.data.title)));
  delete parsed.data.slug;
  const finalContent = matter.stringify(parsed.content, parsed.data);

  await upsertPost(ctx, { slug, rawContent: finalContent, sourceHint: "/new" });
}

// ---- Upsert (shared by /new, upload, and /edit reply) ---------------------

export async function upsertPost(
  ctx: BotContext,
  args: { slug: string; rawContent: string; sourceHint: string },
): Promise<void> {
  let slug = normalizeSlug(args.slug);
  if (!slug) {
    await sendMessage(ctx.chatId, "Slug is empty — I need a title or filename.");
    return;
  }

  // Parse & normalize frontmatter. If missing, bail with a clear error.
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
      "Missing frontmatter. Your file must start with a `---` block containing at least `title`. See /help.",
      { parseMode: "Markdown" },
    );
    return;
  }

  if (!parsed.data.title) {
    await sendMessage(ctx.chatId, "Frontmatter must include `title`.", { parseMode: "Markdown" });
    return;
  }

  if (!parsed.data.date) {
    parsed.data.date = new Date().toISOString().slice(0, 10);
  }
  if (Array.isArray(parsed.data.tags)) {
    parsed.data.tags = parsed.data.tags.map((t) => String(t).trim()).filter(Boolean);
  } else if (typeof parsed.data.tags === "string") {
    parsed.data.tags = parsed.data.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  const isDraft = parsed.data.draft === true || String(parsed.data.draft).toLowerCase() === "true";
  const dir = isDraft ? DRAFTS_DIR : POSTS_DIR;
  const otherDir = isDraft ? POSTS_DIR : DRAFTS_DIR;
  const path = `${dir}/${slug}.mdx`;

  // Allow slug override via frontmatter for resilience.
  if (parsed.data.slug) {
    slug = normalizeSlug(String(parsed.data.slug));
    delete parsed.data.slug;
  }

  const finalContent = matter.stringify(parsed.content, parsed.data);

  try {
    // If the post already exists in the *other* folder (switching draft state),
    // remove it first so we don't end up with duplicates.
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

    const statusLine = isDraft
      ? `Saved as *draft*: \`${slug}\`.`
      : `Published: \`${slug}\` — it'll appear on the site once Vercel redeploys.`;
    await sendMessage(
      ctx.chatId,
      `${statusLine}\n_source_: ${escapeMdCode(args.sourceHint)}`,
      { parseMode: "Markdown" },
    );
  } catch (err) {
    await sendMessage(ctx.chatId, `Failed to save: ${errMsg(err)}`);
  }
}

// ---- Helpers --------------------------------------------------------------

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

async function findPost(
  slug: string,
): Promise<{ content: string; kind: "post" | "draft" } | null> {
  const [pub, draft] = await Promise.all([
    getFile(`${POSTS_DIR}/${slug}.mdx`),
    getFile(`${DRAFTS_DIR}/${slug}.mdx`),
  ]);
  if (pub) return { content: pub.content, kind: "post" };
  if (draft) return { content: draft.content, kind: "draft" };
  return null;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeSlug(s: string): string {
  return slugify(s);
}

function stripCommand(text: string, cmd: string): string {
  const re = new RegExp(`^${cmd}\\b\\s*`, "");
  return text.replace(re, "");
}

/**
 * Accept two inline formats for /new and normalize to a single frontmatter
 * document that gray-matter can parse:
 *
 *   (a) already starts with "---": leave as is.
 *   (b) "key: value" lines, then "---", then body.
 */
function normalizeNewInput(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("---")) return trimmed;

  const sep = trimmed.indexOf("\n---");
  if (sep === -1) {
    // Treat the entire thing as the preamble (no body).
    return `---\n${trimmed}\n---\n`;
  }
  const preamble = trimmed.slice(0, sep).trim();
  const body = trimmed.slice(sep + 4).replace(/^\n/, "");
  return `---\n${preamble}\n---\n${body}`;
}

function tryParseFrontmatter(raw: string): matter.GrayMatterFile<string> | null {
  try {
    const parsed = matter(raw);
    if (!parsed.data || Object.keys(parsed.data).length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

function extractSlugFromEditPrompt(text: string): string | null {
  const m = text.match(/Editing `([^`]+)`/);
  return m ? m[1] : null;
}

function errMsg(e: unknown): string {
  if (e instanceof Error) return e.message;
  return String(e);
}

function escapeMdCode(s: string): string {
  return s.replace(/`/g, "\\`");
}

export { HELP_TEXT };
