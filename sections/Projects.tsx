"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, useMemo } from "react";
import { FadeUp } from "@/components/SplitText";
import { ProjectCard } from "@/components/ProjectCard";
import { projects } from "@/lib/data";
import { cn } from "@/lib/utils";

const FILTERS = ["All", "Security", "AI/ML", "Full-stack", "Research"] as const;

export function Projects() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const filtered = useMemo(() => {
    if (filter === "All") return projects;
    return projects.filter((p) => (p.tags as readonly string[]).includes(filter));
  }, [filter]);

  return (
    <section id="projects" className="relative py-28 md:py-40">
      <div className="container-x">
        <FadeUp>
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="section-label">// 03 — projects</p>
              <h2 className="mt-4 max-w-2xl text-4xl font-medium tracking-tight md:text-5xl">
                Selected work & research.
              </h2>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "mono rounded-full border px-3 py-1.5 text-[10px] uppercase tracking-widest transition-colors",
                    filter === f
                      ? "border-[var(--color-fg)] bg-[var(--color-fg)] text-[var(--color-bg)]"
                      : "border-[var(--color-border-strong)] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]",
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </FadeUp>

        <motion.div
          layout
          className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((p, i) => (
              <motion.div
                key={p.slug}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.35 }}
              >
                <ProjectCard
                  title={p.title}
                  date={p.date}
                  summary={p.summary}
                  highlights={p.highlights}
                  stack={p.stack}
                  tags={p.tags}
                  repo={"repo" in p ? p.repo : undefined}
                  featured={"featured" in p ? p.featured : false}
                  index={i}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
