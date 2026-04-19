"use client";

import { motion, useScroll, useTransform } from "motion/react";
import dynamic from "next/dynamic";
import { useRef } from "react";
import { ArrowDown, ArrowRight, MapPin } from "lucide-react";
import { profile } from "@/lib/data";
import { BlinkingCaret } from "@/components/BlinkingCaret";
import { MagneticButton } from "@/components/MagneticButton";
import { SplitText } from "@/components/SplitText";

const HeroScene = dynamic(
  () => import("@/components/three/HeroScene").then((m) => m.HeroScene),
  { ssr: false },
);

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const sceneY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);

  const onScrollDown = () => {
    const el = document.getElementById("about");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="top"
      ref={ref}
      className="relative flex min-h-[100svh] w-full items-center overflow-hidden pt-20"
    >
      {/* 3D background */}
      <motion.div
        style={{ y: sceneY, opacity }}
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute inset-0 dotted-grid opacity-[0.15]" />
        <div className="absolute inset-x-0 -top-20 bottom-0 md:left-[45%]">
          <HeroScene />
        </div>
        {/* soft gradient glow on left */}
        <div className="absolute left-0 top-1/3 h-96 w-96 rounded-full bg-[var(--color-accent)] opacity-[0.04] blur-[120px]" />
      </motion.div>

      <motion.div
        style={{ y, opacity }}
        className="container-x relative z-10"
      >
        {/* meta row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mono mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] uppercase tracking-widest text-[var(--color-fg-muted)]"
        >
          <span>// 00 — index</span>
          <span className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3" />
            {profile.location}
          </span>
          <span>{profile.coordinates}</span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-accent)]" />
            available for work
          </span>
        </motion.div>

        {/* name */}
        <h1 className="max-w-[15ch] text-[12vw] font-medium leading-[0.92] tracking-[-0.04em] md:text-[7.5rem] lg:text-[9rem]">
          <SplitText mode="word" as="span" className="block">
            Jeet
          </SplitText>
          <SplitText
            mode="word"
            as="span"
            className="block text-[var(--color-fg-muted)]"
            delay={0.15}
          >
            Vijaywargi
          </SplitText>
        </h1>

        {/* tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-8 max-w-xl"
        >
          <p className="mono text-xs uppercase tracking-[0.25em] text-[var(--color-accent)]">
            <span>{profile.role}</span>
            <BlinkingCaret className="ml-2" />
          </p>
          <p className="mt-4 text-lg leading-relaxed text-[var(--color-fg-muted)] md:text-xl">
            <SplitText mode="word" stagger={0.015} delay={1}>
              {profile.tagline}
            </SplitText>
          </p>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.4 }}
          className="mt-10 flex flex-wrap items-center gap-3"
        >
          <MagneticButton
            href="#projects"
            onClick={() => {
              const el = document.getElementById("projects");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
          >
            view work
            <ArrowRight className="h-3.5 w-3.5" />
          </MagneticButton>
          <MagneticButton href="#contact">get in touch</MagneticButton>
          <MagneticButton href="/resume.pdf" external>
            résumé.pdf
          </MagneticButton>
        </motion.div>
      </motion.div>

      {/* scroll cue */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1.8 }}
        style={{ opacity }}
        onClick={onScrollDown}
        className="mono absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--color-fg-muted)]"
      >
        <span>scroll</span>
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </motion.span>
      </motion.button>
    </section>
  );
}
