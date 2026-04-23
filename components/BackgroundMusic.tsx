"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Music, Pause, SkipForward, X } from "lucide-react";

const TRACKS = [
  "/music/lofi-1.mp3",
  "/music/lofi-2.mp3",
  "/music/lofi-3.mp3",
  "/music/lofi-4.mp3",
];
const STORAGE_KEY = "jv.music.dismissed";

type MusicState = "idle" | "playing" | "paused";

export function BackgroundMusic() {
  const [state, setState] = useState<MusicState>("idle");
  const [trackIdx, setTrackIdx] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") setDismissed(true);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => setTrackIdx((i) => (i + 1) % TRACKS.length);
    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, []);

  // External toggle (keyboard shortcut "m"). Resurrects the mini-player if
  // the user previously dismissed it so the hotkey always does something.
  useEffect(() => {
    const onToggle = () => {
      setDismissed(false);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
      const audio = audioRef.current;
      if (!audio) return;
      if (state === "playing") {
        audio.pause();
        setState("paused");
      } else if (state === "paused") {
        audio.play().catch(() => setState("paused"));
        setState("playing");
      } else {
        if (!audio.src) audio.src = TRACKS[trackIdx];
        audio
          .play()
          .then(() => setState("playing"))
          .catch(() => setState("paused"));
      }
    };
    window.addEventListener("music:toggle", onToggle);
    return () => window.removeEventListener("music:toggle", onToggle);
  }, [state, trackIdx]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = TRACKS[trackIdx];
    if (state === "playing") {
      audio.play().catch(() => setState("paused"));
    }
  }, [trackIdx, state]);

  async function handlePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.src) audio.src = TRACKS[trackIdx];
    try {
      await audio.play();
      setState("playing");
    } catch {
      setState("paused");
    }
  }

  function handlePause() {
    audioRef.current?.pause();
    setState("paused");
  }

  function handleResume() {
    audioRef.current?.play().catch(() => setState("paused"));
    setState("playing");
  }

  function handleSkip() {
    setTrackIdx((i) => (i + 1) % TRACKS.length);
  }

  function handleDismiss() {
    audioRef.current?.pause();
    setState("idle");
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  }

  if (dismissed && state === "idle") {
    return <audio ref={audioRef} preload="none" loop={false} />;
  }

  return (
    <div className="fixed bottom-5 left-5 z-50">
      <audio ref={audioRef} preload="none" loop={false} />

      <AnimatePresence mode="wait">
        {state === "idle" ? (
          <motion.button
            key="idle"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            onClick={handlePlay}
            aria-label="play background music"
            className="mono flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/80 px-3 py-2 text-[10px] uppercase tracking-widest text-[var(--color-fg-muted)] shadow-lg backdrop-blur-md transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            <Music className="h-3.5 w-3.5" />
            <span>play music</span>
          </motion.button>
        ) : (
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/80 px-1.5 py-1.5 shadow-lg backdrop-blur-md"
          >
            <button
              onClick={state === "playing" ? handlePause : handleResume}
              aria-label={state === "playing" ? "pause music" : "resume music"}
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-accent)]"
            >
              {state === "playing" ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-accent)] opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-accent)]" />
                  </span>
                  <Pause className="h-3 w-3" />
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-[var(--color-fg-subtle)]" />
                  <Music className="h-3 w-3" />
                </>
              )}
            </button>
            <button
              onClick={handleSkip}
              aria-label="next track"
              className="rounded-full p-1 text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-accent)]"
            >
              <SkipForward className="h-3 w-3" />
            </button>
            <button
              onClick={handleDismiss}
              aria-label="close music player"
              className="rounded-full p-1 text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-accent)]"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
