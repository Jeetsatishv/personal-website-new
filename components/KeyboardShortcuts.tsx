"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { sectionShortcuts } from "@/lib/data";

/**
 * Global 1–9 keyboard shortcuts.
 *
 * Number maps to the "// 0N —" label inside the matching section:
 *   1 About · 2 Experience · 3 Projects · 4 Coursework · 5 Stack
 *   6 Wins · 7 Talk · 8 Philosophy · 9 Contact
 *
 * Shortcuts are ignored when the user is typing in an input/textarea or any
 * contentEditable element, so they don't fight the contact form or the
 * command palette.
 */
export function KeyboardShortcuts() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key.length !== 1) return;

      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target.isContentEditable
        ) {
          return;
        }
      }

      const match = sectionShortcuts.find((s) => s.key === e.key);
      if (!match) return;

      e.preventDefault();

      if (pathname === "/") {
        const el = document.querySelector(match.href);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        router.push(`/${match.href}`);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pathname, router]);

  return null;
}
