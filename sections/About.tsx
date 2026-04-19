"use client";

import { FadeUp, SplitText } from "@/components/SplitText";
import { profile, education } from "@/lib/data";

const stats = [
  { label: "GPA · CMU", value: "3.94" },
  { label: "Dean's List", value: "7/8" },
  { label: "TEDx views", value: "1.5k+" },
  { label: "Endpoints recovered", value: "200+" },
];

export function About() {
  return (
    <section id="about" className="relative py-28 md:py-40">
      <div className="container-x">
        <FadeUp>
          <p className="section-label">// 01 — about</p>
        </FadeUp>

        <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <SplitText
              mode="word"
              as="h2"
              stagger={0.015}
              className="text-3xl font-medium leading-tight tracking-tight md:text-4xl lg:text-5xl"
            >
              {profile.bio}
            </SplitText>

            <FadeUp delay={0.4} className="mt-10 space-y-6">
              <div className="hairline" />
              <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
                {stats.map((s) => (
                  <div key={s.label} className="flex flex-col gap-1">
                    <span className="mono text-[10px] uppercase tracking-widest text-[var(--color-fg-subtle)]">
                      {s.label}
                    </span>
                    <span className="text-3xl font-medium text-[var(--color-fg)]">
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>
            </FadeUp>
          </div>

          <div className="lg:col-span-5">
            <FadeUp delay={0.2}>
              <h3 className="section-label mb-6">education</h3>
              <div className="space-y-6">
                {education.map((ed) => (
                  <div
                    key={ed.school}
                    className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/60 p-5 backdrop-blur-sm transition-colors hover:border-[var(--color-border-strong)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium text-[var(--color-fg)]">
                        {ed.school}
                      </p>
                      <span className="mono text-[10px] whitespace-nowrap text-[var(--color-fg-muted)]">
                        {ed.start} — {ed.end}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[var(--color-fg-muted)]">
                      {ed.degree}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="pill">
                        <span className="text-[var(--color-accent)]">GPA</span>{" "}
                        {ed.gpa}
                      </span>
                      {"honor" in ed && ed.honor && (
                        <span className="pill">{ed.honor}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </FadeUp>
          </div>
        </div>
      </div>
    </section>
  );
}
