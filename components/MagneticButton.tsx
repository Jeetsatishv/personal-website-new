"use client";

import { motion, useMotionValue, useSpring } from "motion/react";
import { MouseEvent, ReactNode, useRef } from "react";
import { cn } from "@/lib/utils";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  strength?: number;
  external?: boolean;
}

export function MagneticButton({
  children,
  className,
  href,
  onClick,
  strength = 0.3,
  external,
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { damping: 15, stiffness: 180 });
  const sy = useSpring(y, { damping: 15, stiffness: 180 });

  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const mx = e.clientX - rect.left - rect.width / 2;
    const my = e.clientY - rect.top - rect.height / 2;
    x.set(mx * strength);
    y.set(my * strength);
  };

  const reset = () => {
    x.set(0);
    y.set(0);
  };

  const Inner = (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={reset}
      style={{ translateX: sx, translateY: sy }}
      className={cn("btn-magnetic", className)}
    >
      <motion.span
        style={{ translateX: sx, translateY: sy }}
        className="inline-flex items-center gap-2"
      >
        {children}
      </motion.span>
    </motion.div>
  );

  if (href) {
    return (
      <a
        href={href}
        onClick={onClick}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className="inline-block"
      >
        {Inner}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className="inline-block">
      {Inner}
    </button>
  );
}
