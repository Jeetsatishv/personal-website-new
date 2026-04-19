"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { ArrowUpRight, Star } from "lucide-react";
import { MouseEvent, useRef } from "react";

interface ProjectCardProps {
  title: string;
  date: string;
  summary: string;
  highlights: readonly string[];
  stack: readonly string[];
  tags: readonly string[];
  repo?: string;
  featured?: boolean;
  index: number;
}

export function ProjectCard({
  title,
  date,
  summary,
  highlights,
  stack,
  tags,
  repo,
  featured,
  index,
}: ProjectCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotX = useTransform(y, [-0.5, 0.5], [5, -5]);
  const rotY = useTransform(x, [-0.5, 0.5], [-5, 5]);
  const srotX = useSpring(rotX, { damping: 20, stiffness: 200 });
  const srotY = useSpring(rotY, { damping: 20, stiffness: 200 });

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{
        duration: 0.7,
        ease: [0.23, 1, 0.32, 1],
        delay: (index % 3) * 0.08,
      }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{
        rotateX: srotX,
        rotateY: srotY,
        transformStyle: "preserve-3d",
        transformPerspective: 1200,
      }}
      className="group relative flex min-h-[320px] flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/60 p-6 backdrop-blur-sm transition-colors hover:border-[var(--color-border-strong)]"
    >
      {/* accent glow */}
      <div className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[var(--color-accent)]/10 via-transparent to-transparent" />
      </div>

      <div className="relative flex items-start justify-between gap-4">
        <div className="mono flex items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--color-fg-subtle)]">
          <span>{date}</span>
          {featured && (
            <span className="flex items-center gap-1 text-[var(--color-warn)]">
              <Star className="h-2.5 w-2.5 fill-current" />
              featured
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {tags.map((t) => (
            <span key={t} className="pill">
              {t}
            </span>
          ))}
        </div>
      </div>

      <h3 className="relative mt-4 text-xl font-medium text-[var(--color-fg)] md:text-2xl">
        {title}
      </h3>

      <p className="relative mt-3 text-sm leading-relaxed text-[var(--color-fg-muted)]">
        {summary}
      </p>

      {highlights.length > 0 && (
        <ul className="relative mt-4 space-y-1.5">
          {highlights.map((h, i) => (
            <li
              key={i}
              className="mono flex gap-2 text-[11px] leading-relaxed text-[var(--color-fg-muted)]"
            >
              <span className="text-[var(--color-accent)]">{`>`}</span>
              <span>{h}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="relative mt-auto flex items-end justify-between pt-5">
        <div className="flex flex-wrap gap-1.5">
          {stack.map((s) => (
            <span
              key={s}
              className="mono rounded-md bg-[var(--color-border)] px-2 py-0.5 text-[10px] text-[var(--color-fg-muted)]"
            >
              {s}
            </span>
          ))}
        </div>
        {repo && (
          <a
            href={repo}
            target="_blank"
            rel="noopener noreferrer"
            className="mono inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-accent)]"
          >
            repo
            <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        )}
      </div>
    </motion.div>
  );
}
