"use client";

import { motion } from "motion/react";
import { Award, GraduationCap, Mic } from "lucide-react";
import { FadeUp } from "@/components/SplitText";
import { achievements } from "@/lib/data";

const iconMap: Record<string, typeof Award> = {
  Speaker: Mic,
  Academic: GraduationCap,
};

export function Achievements() {
  return (
    <section id="achievements" className="relative py-28 md:py-40">
      <div className="container-x">
        <FadeUp>
          <p className="section-label">// 06 — wins</p>
          <h2 className="mt-4 max-w-2xl text-4xl font-medium tracking-tight md:text-5xl">
            Milestones along the way.
          </h2>
        </FadeUp>

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {achievements.map((a, i) => {
            const Icon = iconMap[a.tag] || Award;
            return (
              <motion.div
                key={a.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10% 0px" }}
                transition={{
                  duration: 0.7,
                  ease: [0.23, 1, 0.32, 1],
                  delay: i * 0.08,
                }}
                className="group relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/60 p-6 backdrop-blur-sm transition-colors hover:border-[var(--color-border-strong)]"
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg)]">
                  <Icon className="h-5 w-5 text-[var(--color-accent)]" />
                </div>
                <div className="mono mb-2 text-[10px] uppercase tracking-widest text-[var(--color-fg-subtle)]">
                  {a.tag}
                </div>
                <h3 className="text-xl font-medium text-[var(--color-fg)]">
                  {a.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-fg-muted)]">
                  {a.description}
                </p>
                {/* decorative line */}
                <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-[var(--color-accent)]/5 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
