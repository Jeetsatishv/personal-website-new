import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getAllPosts } from "@/lib/mdx";
import { FadeUp } from "@/components/SplitText";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "Blog",
  description: "Notes on security, AI, and systems.",
};

export default async function BlogIndex() {
  const posts = await getAllPosts();

  return (
    <>
      <section className="min-h-[60vh] pt-40">
        <div className="container-x">
          <FadeUp>
            <p className="section-label">// writing</p>
            <h1 className="mt-4 text-5xl font-medium tracking-tight md:text-7xl">
              Blog
            </h1>
            <p className="mt-6 max-w-xl text-lg text-[var(--color-fg-muted)]">
              Short-form notes on security research, AI, and the systems I work
              on.
            </p>
          </FadeUp>

          <FadeUp delay={0.2}>
            <div className="mt-16 divide-y divide-[var(--color-border)]">
              {posts.length === 0 && (
                <p className="mono py-8 text-sm text-[var(--color-fg-muted)]">
                  No posts yet — check back soon.
                </p>
              )}
              {posts.map((p) => (
                <Link
                  key={p.slug}
                  href={`/blog/${p.slug}`}
                  className="group flex flex-col gap-2 py-6 transition-colors hover:text-[var(--color-accent)] md:flex-row md:items-center md:justify-between md:gap-6"
                >
                  <div className="flex-1">
                    <div className="mono flex items-center gap-3 text-[10px] uppercase tracking-widest text-[var(--color-fg-subtle)]">
                      <span>{p.date}</span>
                      {p.readingTime && <span>· {p.readingTime}</span>}
                    </div>
                    <h2 className="mt-2 text-2xl font-medium">{p.title}</h2>
                    <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
                      {p.description}
                    </p>
                  </div>
                  <ArrowUpRight className="h-5 w-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>
      <Footer />
    </>
  );
}
