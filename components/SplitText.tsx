"use client";

import { motion, useInView } from "motion/react";
import { ReactNode, useRef } from "react";

interface SplitTextProps {
  children: string;
  className?: string;
  delay?: number;
  stagger?: number;
  mode?: "word" | "char";
  as?: keyof React.JSX.IntrinsicElements;
}

export function SplitText({
  children,
  className = "",
  delay = 0,
  stagger = 0.03,
  mode = "word",
  as = "span",
}: SplitTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });

  const parts =
    mode === "word" ? children.split(" ") : children.split("");

  const Tag = as as unknown as React.FC<React.HTMLAttributes<HTMLElement> & { ref?: React.Ref<HTMLElement> }>;

  return (
    <Tag ref={ref} className={className} aria-label={children}>
      <span className="sr-only">{children}</span>
      <span aria-hidden className="inline-block">
        {parts.map((part, i) => (
          <span
            key={i}
            className="inline-block overflow-hidden align-bottom"
          >
            <motion.span
              initial={{ y: "110%", opacity: 0 }}
              animate={
                inView ? { y: "0%", opacity: 1 } : { y: "110%", opacity: 0 }
              }
              transition={{
                duration: 0.7,
                ease: [0.23, 1, 0.32, 1],
                delay: delay + i * stagger,
              }}
              className="inline-block"
            >
              {part}
              {mode === "word" && i < parts.length - 1 ? "\u00A0" : ""}
            </motion.span>
          </span>
        ))}
      </span>
    </Tag>
  );
}

export function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ y: 24, opacity: 0 }}
      animate={inView ? { y: 0, opacity: 1 } : { y: 24, opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
