"use client";

import { motion, useMotionValueEvent, useScroll } from "motion/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { navItems, profile } from "@/lib/data";
import { BlinkingCaret } from "./BlinkingCaret";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const onHome = pathname === "/";

  useMotionValueEvent(scrollY, "change", (y) => {
    setScrolled(y > 40);
  });

  const onNav = (href: string) => (e: React.MouseEvent) => {
    if (!href.startsWith("#")) return;
    e.preventDefault();
    if (onHome) {
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else {
      router.push(`/${href}`);
    }
  };

  const openCmdK = () => {
    window.dispatchEvent(new CustomEvent("cmdk:open"));
  };

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1], delay: 0.3 }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled
          ? "border-b border-[var(--color-border)] bg-[rgba(10,10,11,0.6)] backdrop-blur-xl"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="container-x flex h-14 items-center justify-between">
        <Link
          href="/"
          className="mono flex items-center gap-2 text-sm tracking-widest text-[var(--color-fg)]"
        >
          <span className="text-[var(--color-accent)]">▸</span>
          <span className="uppercase">{profile.name.split(" ")[0]}</span>
          <BlinkingCaret />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const isAnchor = item.href.startsWith("#");
            const href = isAnchor && !onHome ? `/${item.href}` : item.href;
            const className =
              "mono group inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs uppercase tracking-widest text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)]";
            const inner = (
              <>
                <span className="text-[10px] text-[var(--color-fg-subtle)] transition-colors group-hover:text-[var(--color-accent)]">
                  {item.num}
                </span>
                <span>{item.label}</span>
              </>
            );
            if (isAnchor && onHome) {
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={onNav(item.href)}
                  className={className}
                >
                  {inner}
                </a>
              );
            }
            return (
              <Link key={item.href} href={href} className={className}>
                {inner}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1.5 md:flex">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-accent)] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-accent)]" />
            </span>
            <span className="mono text-[10px] uppercase tracking-widest text-[var(--color-fg-muted)]">
              available
            </span>
          </div>

          <button
            onClick={openCmdK}
            className="mono inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] px-3 py-1.5 text-[11px] uppercase tracking-widest text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)]"
            aria-label="Open command palette"
          >
            <span className="hidden sm:inline">menu</span>
            <kbd className="rounded border border-[var(--color-border-strong)] px-1.5 py-0.5 text-[9px]">
              ⌘K
            </kbd>
          </button>
        </div>
      </div>
    </motion.header>
  );
}
