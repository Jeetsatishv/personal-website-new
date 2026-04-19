"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

export function KonamiEasterEgg() {
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    let buffer: string[] = [];
    const onKey = (e: KeyboardEvent) => {
      buffer = [...buffer, e.key].slice(-SEQUENCE.length);
      if (
        buffer.length === SEQUENCE.length &&
        buffer.every((k, i) => k.toLowerCase() === SEQUENCE[i].toLowerCase())
      ) {
        setTriggered(true);
        buffer = [];
        setTimeout(() => setTriggered(false), 3600);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <AnimatePresence>
      {triggered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="pointer-events-none fixed inset-0 z-[300] flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-[var(--color-accent)] mix-blend-difference" />
          <motion.pre
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.1, opacity: 0 }}
            className="mono relative text-center text-[10px] leading-tight text-[var(--color-bg)] md:text-xs"
          >
{`╔═══════════════════════════════╗
║  ACCESS GRANTED               ║
║  root@jeet:~# whoami          ║
║  > security researcher        ║
║  > ai engineer                ║
║  > human                      ║
╚═══════════════════════════════╝`}
          </motion.pre>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
