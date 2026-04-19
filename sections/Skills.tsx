"use client";

import { FadeUp } from "@/components/SplitText";
import { Marquee } from "@/components/Marquee";
import { skills } from "@/lib/data";

// flatten all skill items for the marquee
const allSkills = skills.flatMap((g) => g.items);

export function Skills() {
  return (
    <section
      id="skills"
      className="relative overflow-hidden py-28 md:py-40"
    >
      <div className="container-x">
        <FadeUp>
          <p className="section-label">// 05 — stack</p>
          <h2 className="mt-4 max-w-2xl text-4xl font-medium tracking-tight md:text-5xl">
            Tools I reach for.
          </h2>
        </FadeUp>

        <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {skills.map((group, gi) => (
            <FadeUp key={group.group} delay={gi * 0.05}>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/60 p-6 backdrop-blur-sm transition-colors hover:border-[var(--color-border-strong)]">
                <div className="mono mb-4 flex items-center justify-between text-[10px] uppercase tracking-widest text-[var(--color-fg-subtle)]">
                  <span>0{gi + 1}</span>
                  <span className="text-[var(--color-accent)]">
                    {group.group}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <span
                      key={item}
                      className="mono rounded-md bg-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-fg)]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>

      {/* marquee rows */}
      <div className="mt-20 space-y-4">
        <Marquee>
          {allSkills.map((s, i) => (
            <span
              key={`r1-${i}`}
              className="mono text-4xl uppercase tracking-tight text-[var(--color-fg)]/20 transition-colors hover:text-[var(--color-accent)] md:text-6xl"
            >
              {s} <span className="mx-6 text-[var(--color-accent)]">·</span>
            </span>
          ))}
        </Marquee>
        <Marquee reverse>
          {allSkills
            .slice()
            .reverse()
            .map((s, i) => (
              <span
                key={`r2-${i}`}
                className="mono text-4xl uppercase tracking-tight text-[var(--color-fg)]/10 md:text-6xl"
              >
                {s}{" "}
                <span className="mx-6 text-[var(--color-fg-muted)]">/</span>
              </span>
            ))}
        </Marquee>
      </div>
    </section>
  );
}
