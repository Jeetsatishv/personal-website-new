/**
 * Minimal GitHub Contents API wrapper used by the Telegram blog bot.
 *
 * We talk to GitHub directly over REST (no extra deps) so the bot can live
 * inside the same Next.js app with zero additional footprint. Every write
 * ultimately becomes a commit on `GITHUB_BRANCH`, which triggers a Vercel
 * redeploy of the site.
 */

const GITHUB_API = "https://api.github.com";

function env(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function ghHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${env("GITHUB_TOKEN")}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "jeet-blog-telegram-bot",
  };
}

function repoBase(): string {
  const owner = env("GITHUB_OWNER");
  const repo = env("GITHUB_REPO");
  return `${GITHUB_API}/repos/${owner}/${repo}`;
}

function branch(): string {
  return process.env.GITHUB_BRANCH || "main";
}

export interface GitHubFile {
  path: string;
  name: string;
  sha: string;
  size: number;
  type: "file" | "dir";
}

export async function listDir(dirPath: string): Promise<GitHubFile[]> {
  const url = `${repoBase()}/contents/${encodeURIComponent(dirPath)}?ref=${encodeURIComponent(branch())}`;
  const res = await fetch(url, { headers: ghHeaders(), cache: "no-store" });
  if (res.status === 404) return [];
  if (!res.ok) {
    throw new Error(`GitHub listDir(${dirPath}) failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as GitHubFile[];
  return Array.isArray(data) ? data : [];
}

export interface GitHubFileContent {
  path: string;
  sha: string;
  content: string;
}

export async function getFile(path: string): Promise<GitHubFileContent | null> {
  const url = `${repoBase()}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch())}`;
  const res = await fetch(url, { headers: ghHeaders(), cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub getFile(${path}) failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as {
    content: string;
    encoding: string;
    sha: string;
    path: string;
  };
  const buf = Buffer.from(data.content, data.encoding as BufferEncoding);
  return { path: data.path, sha: data.sha, content: buf.toString("utf-8") };
}

export async function writeFile(args: {
  path: string;
  content: string;
  message: string;
  sha?: string;
}): Promise<void> {
  const url = `${repoBase()}/contents/${encodeURIComponent(args.path)}`;
  const body = {
    message: args.message,
    content: Buffer.from(args.content, "utf-8").toString("base64"),
    branch: branch(),
    ...(args.sha ? { sha: args.sha } : {}),
  };
  const res = await fetch(url, {
    method: "PUT",
    headers: { ...ghHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`GitHub writeFile(${args.path}) failed: ${res.status} ${await res.text()}`);
  }
}

export async function deleteFile(args: {
  path: string;
  sha: string;
  message: string;
}): Promise<void> {
  const url = `${repoBase()}/contents/${encodeURIComponent(args.path)}`;
  const body = {
    message: args.message,
    sha: args.sha,
    branch: branch(),
  };
  const res = await fetch(url, {
    method: "DELETE",
    headers: { ...ghHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`GitHub deleteFile(${args.path}) failed: ${res.status} ${await res.text()}`);
  }
}

/**
 * Move a file by creating it at the new path and deleting the old path.
 * Done as two commits for simplicity; Vercel will batch-rebuild either way.
 */
export async function moveFile(args: {
  from: string;
  to: string;
  message: string;
}): Promise<void> {
  const existing = await getFile(args.from);
  if (!existing) throw new Error(`Source file not found: ${args.from}`);
  await writeFile({ path: args.to, content: existing.content, message: args.message });
  await deleteFile({ path: args.from, sha: existing.sha, message: `${args.message} (remove original)` });
}
