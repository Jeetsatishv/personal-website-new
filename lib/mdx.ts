import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags?: string[];
  readingTime?: string;
}

export interface Post extends PostMeta {
  content: string;
}

async function readPostFile(slug: string): Promise<Post | null> {
  const filePath = path.join(POSTS_DIR, `${slug}.mdx`);
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const { data, content } = matter(raw);
    if (data.draft === true || String(data.draft).toLowerCase() === "true") {
      return null;
    }
    const words = content.split(/\s+/).length;
    return {
      slug,
      title: data.title ?? slug,
      description: data.description ?? "",
      date: data.date ?? "",
      tags: data.tags ?? [],
      readingTime: `${Math.max(1, Math.ceil(words / 220))} min read`,
      content,
    };
  } catch {
    return null;
  }
}

export async function getAllPosts(): Promise<PostMeta[]> {
  try {
    const files = await fs.readdir(POSTS_DIR);
    const mdxFiles = files.filter((f) => f.endsWith(".mdx") && !f.startsWith("_"));
    const posts = await Promise.all(
      mdxFiles.map(async (f) => readPostFile(f.replace(/\.mdx$/, ""))),
    );
    return posts
      .filter((p): p is Post => p !== null)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .map(({ content: _content, ...meta }) => meta);
  } catch {
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  return readPostFile(slug);
}

export async function getAllPostSlugs(): Promise<string[]> {
  const posts = await getAllPosts();
  return posts.map((p) => p.slug);
}
