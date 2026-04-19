"use client";

import { FadeUp } from "@/components/SplitText";
import { TimelineItem } from "@/components/TimelineItem";
import { experience } from "@/lib/data";

export function Experience() {
  return (
    <section id="experience" className="relative py-28 md:py-40">
      <div className="container-x">
        <FadeUp>
          <p className="section-label">// 02 — experience</p>
          <h2 className="mt-4 max-w-3xl text-4xl font-medium tracking-tight md:text-5xl">
            Building, breaking, and defending systems.
          </h2>
        </FadeUp>

        <div className="mt-14 max-w-4xl">
          {experience.map((exp, i) => (
            <TimelineItem
              key={`${exp.company}-${exp.start}`}
              company={exp.company}
              role={exp.role}
              start={exp.start}
              end={exp.end}
              location={exp.location}
              bullets={exp.bullets}
              stack={exp.stack}
              index={i}
              isLast={i === experience.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
