"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Music, Pause, Play, X } from "lucide-react";

const PLAYLIST_ID = "37i9dQZF1DWZeKCadgRdKQ";
const STORAGE_KEY = "jv.music.preferences";

type MusicState = "idle" | "playing" | "paused";

export function BackgroundMusic() {
  const [state, setState] = useState<MusicState>("idle");
  const [panelOpen, setPanelOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === "dismissed") setDismissed(true);
    } catch {
      // ignore
    }
  }, []);

  function handleToggle() {
    if (state === "playing") {
      setState("paused");
      iframeRef.current?.contentWindow?.postMessage(
        { command: "toggle" },
        "*",
      );
      return;
    }
    if (state === "paused") {
      setState("playing");
      iframeRef.current?.contentWindow?.postMessage(
        { command: "toggle" },
        "*",
      );
      return;
    }
    setState("playing");
    setPanelOpen(true);
  }

  function handleClose() {
    setState("idle");
    setPanelOpen(false);
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "dismissed");
    } catch {
      // ignore
    }
  }

  if (dismissed && state === "idle") return null;

  const icon =
    state === "playing" ? (
      <Pause className="h-3.5 w-3.5" />
    ) : state === "paused" ? (
      <Play className="h-3.5 w-3.5" />
    ) : (
      <Music className="h-3.5 w-3.5" />
    );

  const label =
    state === "playing"
      ? "pause"
      : state === "paused"
        ? "resume"
        : "play music";

  return (
    <div className="fixed bottom-5 left-5 z-50 flex flex-col items-start gap-2">
      <AnimatePresence>
        {panelOpen && state !== "idle" && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/90 shadow-xl backdrop-blur-md"
            style={{ width: 300 }}
          >
            <iframe
              ref={iframeRef}
              src={`https://open.spotify.com/embed/playlist/${PLAYLIST_ID}?utm_source=generator&theme=0`}
              width="300"
              height="80"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title="Background music"
              className="block border-0"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2">
        <button
          onClick={handleToggle}
          aria-label={`${label} background music`}
          className="mono flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/80 px-3 py-2 text-[10px] uppercase tracking-widest text-[var(--color-fg-muted)] shadow-lg backdrop-blur-md transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
        >
          {icon}
          <span>{label}</span>
        </button>
        {state !== "idle" && (
          <button
            onClick={handleClose}
            aria-label="close music player"
            className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/80 p-2 text-[var(--color-fg-muted)] shadow-lg backdrop-blur-md transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
