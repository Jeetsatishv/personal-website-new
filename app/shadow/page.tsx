import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "shadow",
  description: "",
  robots: { index: false, follow: false },
};

export default function ShadowPage() {
  return (
    <section className="relative min-h-screen py-28 pt-32">
      <div className="container-x max-w-2xl">
        <Link
          href="/ctf"
          className="mono inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-accent)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          back to ctf
        </Link>

        <div className="mt-10 overflow-hidden rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)]">
          <div className="mono flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2 text-[10px] uppercase tracking-widest text-[var(--color-fg-subtle)]">
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#27c93f]" />
            <span className="ml-2">shadow @ jeetcreates:~$</span>
          </div>
          <div className="mono space-y-2 px-6 py-8 text-sm leading-relaxed text-[var(--color-fg-muted)]">
            <p>
              <span className="text-[var(--color-accent)]">$</span> cat
              /flag.txt
            </p>
            <pre className="rounded-lg bg-[var(--color-bg)] p-4 text-[var(--color-fg)]">
              <code className="text-[var(--color-accent)]">
                JV{`{y0u_f0und_th3_sh4d0w}`}
              </code>
            </pre>
            <p className="pt-4 text-[var(--color-fg-subtle)]">
              <span className="text-[var(--color-accent)]">$</span> echo
              &quot;nice recon. copy the flag above and submit it on the ctf
              page.&quot;
            </p>
            <p className="text-[var(--color-fg-subtle)]">
              <span className="text-[var(--color-accent)]">$</span> _
              <span className="animate-pulse text-[var(--color-accent)]">
                ▌
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
