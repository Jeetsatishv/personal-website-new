"use client";

import { motion } from "motion/react";
import { Check, Flag, X } from "lucide-react";
import { FormEvent, useState } from "react";

type Status = "idle" | "sending" | "sent" | "error";

export function CtfForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/ctf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          flag: fd.get("flag"),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      setStatus("sent");
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/60 p-6 backdrop-blur-sm md:p-8"
    >
      <p className="mono text-[10px] uppercase tracking-widest text-[var(--color-fg-subtle)]">
        // submit flag
      </p>
      <div className="grid gap-5 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="mono text-[10px] uppercase tracking-widest text-[var(--color-fg-subtle)]">
            name
          </span>
          <input
            name="name"
            required
            minLength={2}
            maxLength={80}
            className="rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-fg)] outline-none transition-colors focus:border-[var(--color-accent)]"
            placeholder="Your name"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="mono text-[10px] uppercase tracking-widest text-[var(--color-fg-subtle)]">
            email
          </span>
          <input
            name="email"
            type="email"
            required
            className="rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-fg)] outline-none transition-colors focus:border-[var(--color-accent)]"
            placeholder="you@example.com"
          />
        </label>
      </div>
      <label className="flex flex-col gap-2">
        <span className="mono text-[10px] uppercase tracking-widest text-[var(--color-fg-subtle)]">
          flag
        </span>
        <input
          name="flag"
          required
          autoComplete="off"
          spellCheck={false}
          className="mono rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-fg)] outline-none transition-colors focus:border-[var(--color-accent)]"
          placeholder="JV{...}"
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <motion.button
          type="submit"
          disabled={status === "sending" || status === "sent"}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mono inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-6 py-3 text-xs uppercase tracking-widest text-[var(--color-bg)] transition-opacity disabled:opacity-60"
        >
          {status === "idle" && (
            <>
              submit flag
              <Flag className="h-3.5 w-3.5" />
            </>
          )}
          {status === "sending" && (
            <>
              verifying
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-3.5 w-3.5 rounded-full border-2 border-[var(--color-bg)] border-t-transparent"
              />
            </>
          )}
          {status === "sent" && (
            <>
              captured
              <Check className="h-3.5 w-3.5" />
            </>
          )}
          {status === "error" && (
            <>
              retry
              <X className="h-3.5 w-3.5" />
            </>
          )}
        </motion.button>
      </div>

      {status === "sent" && (
        <p className="mono text-xs uppercase tracking-widest text-[var(--color-accent)]">
          // gg — Jeet has been notified
        </p>
      )}
      {status === "error" && error && (
        <p className="mono text-xs text-[var(--color-warn)]">{error}</p>
      )}
    </form>
  );
}
