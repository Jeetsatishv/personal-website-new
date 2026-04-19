"use client";

import { ArrowUpRight, Github, Instagram, Linkedin, Mail } from "lucide-react";
import { FadeUp, SplitText } from "@/components/SplitText";
import { ContactForm } from "@/components/ContactForm";
import { profile } from "@/lib/data";

const socials = [
  { name: "GitHub", href: profile.socials.github, icon: Github },
  { name: "LinkedIn", href: profile.socials.linkedin, icon: Linkedin },
  { name: "Instagram", href: profile.socials.instagram, icon: Instagram },
  { name: "Email", href: profile.socials.email, icon: Mail },
];

export function Contact() {
  return (
    <section id="contact" className="relative py-28 md:py-40">
      <div className="container-x">
        <FadeUp>
          <p className="section-label">// 07 — contact</p>
        </FadeUp>

        <div className="mt-10 grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <SplitText
              mode="word"
              as="h2"
              className="text-5xl font-medium tracking-tight md:text-7xl"
            >
              Let&apos;s build something.
            </SplitText>
            <FadeUp delay={0.2} className="mt-6 max-w-lg">
              <p className="text-lg leading-relaxed text-[var(--color-fg-muted)]">
                Whether it&apos;s a security audit, ML collaboration, or just a
                good conversation — my inbox is open.
              </p>
            </FadeUp>

            <FadeUp delay={0.3}>
              <div className="mt-10 space-y-4">
                {socials.map((s) => {
                  const Icon = s.icon;
                  return (
                    <a
                      key={s.name}
                      href={s.href}
                      target={s.href.startsWith("http") ? "_blank" : undefined}
                      rel={
                        s.href.startsWith("http")
                          ? "noopener noreferrer"
                          : undefined
                      }
                      className="group flex items-center justify-between gap-4 border-b border-[var(--color-border)] py-4 transition-colors hover:border-[var(--color-accent)]"
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-[var(--color-fg-muted)] transition-colors group-hover:text-[var(--color-accent)]" />
                        <span className="mono text-sm uppercase tracking-widest">
                          {s.name}
                        </span>
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-[var(--color-fg-muted)] transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--color-accent)]" />
                    </a>
                  );
                })}
              </div>
            </FadeUp>
          </div>

          <div className="lg:col-span-5">
            <FadeUp delay={0.15}>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/60 p-6 backdrop-blur-sm md:p-8">
                <ContactForm />
              </div>
            </FadeUp>
          </div>
        </div>
      </div>
    </section>
  );
}
