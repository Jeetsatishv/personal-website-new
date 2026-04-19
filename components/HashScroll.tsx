"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

export function HashScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/") return;
    const hash = window.location.hash;
    if (!hash) return;
    const id = hash.slice(1);
    const scroll = () => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    const t = setTimeout(scroll, 180);
    return () => clearTimeout(t);
  }, [pathname]);

  return null;
}
