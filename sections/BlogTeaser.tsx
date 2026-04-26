import Link from "next/link";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { getAllPosts } from "@/lib/mdx";
import { FadeUp } from "@/components/SplitText";

/**
 * Minimalist blog preview that lives between the Writing (philosophy) and
 * Contact sections on the homepage. Surfaces the two most recent posts plus
 * a clear CTA into the full /blog index. Async server component because we
 * read posts from disk via `getAllPosts()` at build time.
 */
export async function BlogTeaser() {
  const posts = (await getAllPosts()).slice(0, 2);

  return (
    <section id="blog-preview" className="relative py-28 md:py-40">
      <div className="container-x">
        <FadeUp>
          <p className="section-label">// blog</p>
          <h2 className="mt-4 max-w-2xl text-4xl font-medium tracking-tight md:text-5xl">
            Notes from the work.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--color-fg-muted)]">
            Short-form writing on security research, AI, and whatever
            infrastructure rabbit hole I&apos;m in.
          </p>
        </FadeUp>

        {posts.length > 0 && (
          <FadeUp delay={0.15}>
            <div className="mt-12 divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
              {posts.map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="group flex flex-col gap-1 py-5 transition-colors md:flex-row md:items-center md:justify-between md:gap-6"
                >
                  <div className="flex-1">
                    <div className="mono flex items-center gap-3 text-[10px] uppercase tracking-widest text-[var(--color-fg-subtle)]">
                      <span>{p.date}</span>
                      {p.readingTime && <span>· {p.readingTime}</span>}
                    </div>
                    <h3 className="mt-1.5 text-lg font-medium text-[var(--color-fg)] transition-colors group-hover:text-[var(--color-accent)]">
                      {p.title}
                    </h3>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-[var(--color-fg-subtle)] transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--color-accent)]" />
                </Link>
              ))}
            </div>
          </FadeUp>
        )}

        <FadeUp delay={0.25}>
          <div className="mt-8">
            <Link
              href="/blog"
              className="mono inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-4 py-2 text-[10px] uppercase tracking-widest text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              <BookOpen className="h-3 w-3" />
              <span>read all posts</span>
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
