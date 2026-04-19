"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

export function Cursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { damping: 22, stiffness: 320, mass: 0.5 });
  const sy = useSpring(y, { damping: 22, stiffness: 320, mass: 0.5 });

  const [variant, setVariant] = useState<"default" | "hover" | "text">(
    "default",
  );
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(pointer: fine)");
    setEnabled(mq.matches);
    const onChange = () => setEnabled(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);

      const target = e.target as HTMLElement | null;
      if (!target) return setVariant("default");

      if (
        target.closest(
          "a, button, [data-cursor='hover'], input, textarea, [role='button']",
        )
      ) {
        setVariant("hover");
      } else if (target.closest("[data-cursor='text'], p, h1, h2, h3, h4, li")) {
        setVariant("text");
      } else {
        setVariant("default");
      }
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [enabled, x, y]);

  if (!enabled) return null;

  const size =
    variant === "hover" ? 44 : variant === "text" ? 4 : 12;

  return (
    <>
      <motion.div
        aria-hidden
        style={{ translateX: sx, translateY: sy }}
        className="pointer-events-none fixed left-0 top-0 z-[9999] -translate-x-1/2 -translate-y-1/2 mix-blend-difference"
      >
        <motion.div
          animate={{
            width: size,
            height: size,
            borderRadius: 999,
            backgroundColor:
              variant === "hover" ? "#f5f5f7" : "#34d399",
            opacity: variant === "text" ? 0.6 : 1,
          }}
          transition={{ type: "spring", damping: 25, stiffness: 400 }}
          className="rounded-full"
        />
      </motion.div>
      {/* outer ring */}
      <motion.div
        aria-hidden
        style={{ translateX: x, translateY: y }}
        className="pointer-events-none fixed left-0 top-0 z-[9998] -translate-x-1/2 -translate-y-1/2"
      >
        <motion.div
          animate={{
            width: variant === "hover" ? 0 : 28,
            height: variant === "hover" ? 0 : 28,
            opacity: variant === "default" ? 0.35 : 0,
          }}
          transition={{ type: "spring", damping: 20, stiffness: 250 }}
          className="rounded-full border border-[var(--color-accent)]"
        />
      </motion.div>
    </>
  );
}
