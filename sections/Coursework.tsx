"use client";

import { FadeUp } from "@/components/SplitText";
import { coursework } from "@/lib/data";

export function Coursework() {
  return (
    <section id="coursework" className="relative py-28 md:py-40">
      <div className="container-x">
        <FadeUp>
          <p className="section-label">// 04 — coursework</p>
          <h2 className="mt-4 max-w-3xl text-4xl font-medium tracking-tight md:text-5xl">
            What CMU taught me.
          </h2>
          <p className="mt-5 max-w-2xl text-[var(--color-fg-muted)]">
            M.S. in AI Engineering — Information Security. A blend of offensive
            security, network defense, and applied machine learning.
          </p>
        </FadeUp>

        <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {coursework.map((course, i) => (
            <FadeUp key={course.code} delay={Math.min(i * 0.03, 0.3)}>
              <div className="group h-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/60 p-6 backdrop-blur-sm transition-colors hover:border-[var(--color-border-strong)]">
                <div className="mono mb-3 flex items-center justify-between text-[10px] uppercase tracking-widest text-[var(--color-fg-subtle)]">
                  <span className="text-[var(--color-accent)]">
                    {course.code}
                  </span>
                  {"semester" in course && course.semester && (
                    <span>{course.semester}</span>
                  )}
                </div>
                <h3 className="mb-1 text-lg font-medium leading-snug text-[var(--color-fg)]">
                  {course.title}
                </h3>
                <p className="mono mb-4 text-[10px] uppercase tracking-widest text-[var(--color-fg-muted)]">
                  {course.group}
                </p>
                <ul className="space-y-1.5 text-sm text-[var(--color-fg-muted)]">
                  {course.topics.map((topic) => (
                    <li key={topic} className="flex gap-2">
                      <span className="text-[var(--color-accent)]">·</span>
                      <span>{topic}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
