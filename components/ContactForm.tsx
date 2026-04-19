"use client";

import { motion } from "motion/react";
import { Check, Send, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { profile } from "@/lib/data";

type Status = "idle" | "sending" | "sent" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          message: fd.get("message"),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Request failed (${res.status})`);
      }
      setStatus("sent");
      (e.target as HTMLFormElement).reset();
      setTimeout(() => setStatus("idle"), 4000);
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof Error ? err.message : "Something went wrong",
      );
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="group flex flex-col gap-2">
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
        <label className="group flex flex-col gap-2">
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
          message
        </span>
        <textarea
          name="message"
          required
          minLength={10}
          maxLength={2000}
          rows={5}
          className="resize-none rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-4 py-3 text-sm text-[var(--color-fg)] outline-none transition-colors focus:border-[var(--color-accent)]"
          placeholder="What's on your mind?"
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <motion.button
          type="submit"
          disabled={status === "sending" || status === "sent"}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mono inline-flex items-center gap-2 rounded-full bg-[var(--color-fg)] px-6 py-3 text-xs uppercase tracking-widest text-[var(--color-bg)] transition-opacity disabled:opacity-60"
        >
          {status === "idle" && (
            <>
              send message
              <Send className="h-3.5 w-3.5" />
            </>
          )}
          {status === "sending" && (
            <>
              sending
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-3.5 w-3.5 rounded-full border-2 border-[var(--color-bg)] border-t-transparent"
              />
            </>
          )}
          {status === "sent" && (
            <>
              sent
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
        <a
          href={`mailto:${profile.email}`}
          className="mono text-xs uppercase tracking-widest text-[var(--color-fg-muted)] transition-colors hover:text-[var(--color-fg)]"
        >
          or email directly →
        </a>
      </div>
      {status === "error" && error && (
        <p className="mono text-xs text-[var(--color-warn)]">{error}</p>
      )}
    </form>
  );
}
