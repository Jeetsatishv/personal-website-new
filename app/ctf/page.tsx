import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Footer } from "@/components/Footer";
import { CtfForm } from "@/components/CtfForm";

export const metadata: Metadata = {
  title: "CTF",
  description:
    "A tiny capture-the-flag challenge. Find the flag, submit it, and Jeet will be notified.",
};

export default function CtfPage() {
  return (
    <>
      <section className="relative min-h-screen py-28 pt-32 md:py-40">
        <div className="container-x max-w-3xl">
          <Link
            href="/"
            className="mono inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-accent)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            back home
          </Link>

          <div className="mt-10">
            <p className="mono text-[10px] uppercase tracking-widest text-[var(--color-accent)]">
              // optional — capture the flag
            </p>
            <h1 className="mt-4 text-4xl font-medium tracking-tight md:text-6xl">
              Find the flag.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-[var(--color-fg-muted)]">
              Somewhere on this site there&apos;s a flag in the shape{" "}
              <code className="mono rounded bg-[var(--color-border)] px-1.5 py-0.5 text-sm text-[var(--color-accent)]">
                JV{`{...}`}
              </code>
              . Capture it, drop it below with your email, and I&apos;ll get
              pinged the moment you solve it.
            </p>
          </div>

          <div className="mt-12 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/60 p-6 backdrop-blur-sm md:p-8">
            <p className="mono mb-4 text-[10px] uppercase tracking-widest text-[var(--color-fg-subtle)]">
              // rules
            </p>
            <ul className="space-y-2 text-sm text-[var(--color-fg-muted)]">
              <li className="flex gap-2">
                <span className="text-[var(--color-accent)]">·</span>
                <span>
                  Only recon tools you already have: browser, devtools, curiosity.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--color-accent)]">·</span>
                <span>
                  Every crawler-friendly site has one file that politely tells
                  bots where <em>not</em> to look. Start there.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--color-accent)]">·</span>
                <span>
                  Submit the exact string, including the <code>JV{`{`}</code>{" "}
                  prefix and closing brace.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-[var(--color-accent)]">·</span>
                <span>
                  When you solve it, I get an email with your name. Say hi.
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-8">
            <CtfForm />
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
