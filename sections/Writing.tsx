"use client";

import { motion } from "motion/react";
import { ArrowUpRight, BookOpen } from "lucide-react";
import { FadeUp } from "@/components/SplitText";
import { writing } from "@/lib/data";

export function Writing() {
  return (
    <section id="writing" className="relative py-28 md:py-40">
      <div className="container-x">
        <FadeUp>
          <p className="section-label">// 08 — writing</p>
          <h2 className="mt-4 max-w-2xl text-4xl font-medium tracking-tight md:text-5xl">
            Philosophy, on the side.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--color-fg-muted)]">
            When I'm not breaking systems, I'm thinking about why we build them
            in the first place. Short essays on ethics, virtue, and the absurd
            — published on Medium.
          </p>
        </FadeUp>

        <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {writing.map((piece, i) => (
            <motion.a
              key={piece.href}
              href={piece.href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{
                duration: 0.7,
                ease: [0.23, 1, 0.32, 1],
                delay: i * 0.06,
              }}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/60 p-6 backdrop-blur-sm transition-colors hover:border-[var(--color-border-strong)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg)]">
                  <BookOpen className="h-4 w-4 text-[var(--color-accent)]" />
                </div>
                <ArrowUpRight className="h-4 w-4 -translate-x-1 translate-y-1 text-[var(--color-fg-subtle)] opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:text-[var(--color-accent)] group-hover:opacity-100" />
              </div>

              <div className="mono mt-6 flex items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--color-fg-subtle)]">
                <span>{piece.tag}</span>
                <span className="h-1 w-1 rounded-full bg-[var(--color-accent)]" />
                <span>{piece.date}</span>
              </div>

              <h3 className="mt-3 text-lg font-medium leading-snug text-[var(--color-fg)]">
                {piece.title}
              </h3>

              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[var(--color-fg-muted)]">
                {piece.summary}
              </p>

              <div className="pointer-events-none absolute -right-16 -bottom-16 h-40 w-40 rounded-full bg-[var(--color-accent)]/5 blur-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </motion.a>
          ))}
        </div>

        <FadeUp delay={0.3} className="mt-10">
          <a
            href="https://medium.com/@jeetsatishv"
            target="_blank"
            rel="noopener noreferrer"
            className="mono inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-4 py-2 text-[10px] uppercase tracking-widest text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            <span>all essays on medium</span>
            <ArrowUpRight className="h-3 w-3" />
          </a>
        </FadeUp>
      </div>
    </section>
  );
}
