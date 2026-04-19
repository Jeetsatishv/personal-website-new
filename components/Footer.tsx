"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flag } from "lucide-react";
import { profile } from "@/lib/data";

export function Footer() {
  const [now, setNow] = useState("");

  useEffect(() => {
    const update = () =>
      setNow(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "America/New_York",
        }),
      );
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <footer className="relative border-t border-[var(--color-border)] py-10">
      <div className="container-x">
        <div className="mono flex flex-col gap-4 text-[10px] uppercase tracking-widest text-[var(--color-fg-subtle)] md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <span>© {new Date().getFullYear()} {profile.name}</span>
            <span>·</span>
            <span>{profile.location}</span>
            <span>·</span>
            <span suppressHydrationWarning>
              {now ? `${now} EST` : "—"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/ctf"
              className="group inline-flex items-center gap-1.5 transition-colors hover:text-[var(--color-accent)]"
              aria-label="capture the flag"
            >
              <Flag className="h-3 w-3 text-[var(--color-accent)] transition-transform group-hover:-translate-y-0.5" />
              <span>ctf</span>
            </Link>
            <span className="h-1 w-1 rounded-full bg-[var(--color-accent)]" />
            <span className="normal-case tracking-normal italic text-[var(--color-fg-muted)]">
              &ldquo;The quieter you become, the more you are able to hear.&rdquo;
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
