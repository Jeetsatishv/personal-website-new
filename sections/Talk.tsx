"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Play, ExternalLink } from "lucide-react";
import { FadeUp } from "@/components/SplitText";
import { talk } from "@/lib/data";

export function Talk() {
  const [playing, setPlaying] = useState(false);
  const thumb = `https://i.ytimg.com/vi/${talk.videoId}/maxresdefault.jpg`;
  const embed = `https://www.youtube-nocookie.com/embed/${talk.videoId}?autoplay=1&rel=0&modestbranding=1`;

  return (
    <section id="talk" className="relative py-28 md:py-40">
      <div className="container-x">
        <FadeUp>
          <p className="section-label">// 07 — talk</p>
          <h2 className="mt-4 max-w-3xl text-4xl font-medium tracking-tight md:text-5xl">
            {talk.title}
          </h2>
          <p className="mono mt-4 text-[11px] uppercase tracking-widest text-[var(--color-fg-subtle)]">
            {talk.event}
          </p>
        </FadeUp>

        <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-14">
          <FadeUp delay={0.15} className="lg:col-span-8">
            <motion.div
              className="group relative aspect-video overflow-hidden rounded-2xl border border-[var(--color-border)] bg-black"
              whileHover={{ scale: playing ? 1 : 1.005 }}
              transition={{ duration: 0.3 }}
            >
              {playing ? (
                <iframe
                  src={embed}
                  title={talk.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="h-full w-full"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setPlaying(true)}
                  aria-label="play tedx talk"
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <img
                    src={thumb}
                    alt={talk.title}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="relative flex flex-col items-center gap-3">
                    <span className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--color-accent)] bg-black/60 text-[var(--color-accent)] backdrop-blur transition-all duration-300 group-hover:scale-110 group-hover:bg-[var(--color-accent)] group-hover:text-black">
                      <Play className="h-6 w-6 translate-x-0.5" />
                    </span>
                    <span className="mono text-[10px] uppercase tracking-widest text-[var(--color-fg)]">
                      watch on site
                    </span>
                  </div>
                </button>
              )}
            </motion.div>
          </FadeUp>

          <FadeUp delay={0.3} className="lg:col-span-4">
            <div className="hairline mb-6" />
            <p className="text-base leading-relaxed text-[var(--color-fg-muted)]">
              {talk.description}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={talk.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mono inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-4 py-2 text-[10px] uppercase tracking-widest text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                <span>open on youtube</span>
                <ExternalLink className="h-3 w-3" />
              </a>
              <a
                href={talk.tedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mono inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-4 py-2 text-[10px] uppercase tracking-widest text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              >
                <span>ted.com</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
