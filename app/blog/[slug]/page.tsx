import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllPostSlugs, getPostBySlug } from "@/lib/mdx";
import { Footer } from "@/components/Footer";
import { ReadingProgress } from "@/components/ReadingProgress";

export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = await getAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
  };
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return (
    <>
      <ReadingProgress />
      <article className="min-h-screen pt-32">
        <div className="container-x max-w-3xl">
          <Link
            href="/blog"
            className="mono inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-accent)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            back to blog
          </Link>
          <header className="mt-10 border-b border-[var(--color-border)] pb-10">
            <div className="mono flex items-center gap-3 text-[10px] uppercase tracking-widest text-[var(--color-fg-subtle)]">
              <span>{post.date}</span>
              {post.readingTime && <span>· {post.readingTime}</span>}
              {post.tags?.map((t) => (
                <span key={t} className="pill">
                  {t}
                </span>
              ))}
            </div>
            <h1 className="mt-4 text-4xl font-medium leading-tight tracking-tight md:text-5xl">
              {post.title}
            </h1>
            {post.description && (
              <p className="mt-4 text-lg text-[var(--color-fg-muted)]">
                {post.description}
              </p>
            )}
          </header>

          <div className="prose prose-invert mt-10 max-w-none prose-headings:font-medium prose-headings:tracking-tight prose-a:text-[var(--color-accent)] prose-strong:text-[var(--color-fg)] prose-code:text-[var(--color-accent)] prose-code:before:content-none prose-code:after:content-none">
            <MDXRemote source={post.content} />
          </div>
        </div>
      </article>
      <Footer />
    </>
  );
}
