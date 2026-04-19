"use client";

import { motion, useInView } from "motion/react";
import { useRef } from "react";

interface TimelineItemProps {
  company: string;
  role: string;
  start: string;
  end: string;
  location: string;
  bullets: readonly string[];
  stack: readonly string[];
  index: number;
  isLast?: boolean;
}

export function TimelineItem({
  company,
  role,
  start,
  end,
  location,
  bullets,
  stack,
  index,
  isLast,
}: TimelineItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });

  return (
    <div ref={ref} className="relative grid grid-cols-[auto_1fr] gap-x-6 pb-12 md:gap-x-10">
      {/* rail */}
      <div className="relative flex flex-col items-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={inView ? { scale: 1 } : { scale: 0 }}
          transition={{
            duration: 0.5,
            ease: [0.23, 1, 0.32, 1],
            delay: 0.1,
          }}
          className="relative z-10 mt-2 h-3 w-3 rounded-full border-2 border-[var(--color-accent)] bg-[var(--color-bg)]"
        >
          <motion.span
            animate={{ scale: [1, 1.6, 1], opacity: [0.4, 0, 0.4] }}
            transition={{ duration: 2.2, repeat: Infinity }}
            className="absolute -inset-1 rounded-full bg-[var(--color-accent)]"
            style={{ zIndex: -1 }}
          />
        </motion.div>
        {!isLast && (
          <motion.div
            initial={{ scaleY: 0 }}
            animate={inView ? { scaleY: 1 } : { scaleY: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{ originY: 0 }}
            className="absolute left-1/2 top-5 h-full w-px -translate-x-1/2 bg-gradient-to-b from-[var(--color-border-strong)] to-transparent"
          />
        )}
      </div>

      {/* content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.7, delay: 0.15 }}
        className="min-w-0"
      >
        <div className="mono mb-2 flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-widest text-[var(--color-fg-subtle)]">
          <span>0{index + 1}</span>
          <span>
            {start} — {end}
          </span>
          <span>{location}</span>
        </div>
        <h3 className="text-xl font-medium text-[var(--color-fg)] md:text-2xl">
          {role}
          <span className="text-[var(--color-fg-muted)]"> @ {company}</span>
        </h3>
        <ul className="mt-4 space-y-2.5">
          {bullets.map((b, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={
                inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }
              }
              transition={{ duration: 0.5, delay: 0.25 + i * 0.06 }}
              className="flex gap-3 text-sm leading-relaxed text-[var(--color-fg-muted)] md:text-[15px]"
            >
              <span className="mono mt-1.5 text-[var(--color-accent)]">▸</span>
              <span>{b}</span>
            </motion.li>
          ))}
        </ul>
        <div className="mt-5 flex flex-wrap gap-2">
          {stack.map((t) => (
            <span key={t} className="pill">
              {t}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
