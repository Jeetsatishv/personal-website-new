"use client";

/**
 * Floating chatbot mounted globally on the site.
 *
 * - Bottom-right pill that mirrors the music player on the bottom-left.
 * - Click to expand into a chat panel; the panel uses the same dark, glassy
 *   surfaces as the rest of the site (var(--color-bg-elevated), borders,
 *   accent green, mono labels).
 * - Streaming answers via AI SDK v6's `useChat`. Conversation persists in
 *   localStorage so refresh doesn't wipe context within a single session.
 */

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { AnimatePresence, motion } from "motion/react";
import { Bot, Send, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const STORAGE_KEY = "jv.chat.v1";

const SUGGESTIONS = [
  "What does Jeet work on?",
  "Tell me about his projects",
  "What was his TEDx talk about?",
  "How do I contact him?",
];

export function Chat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Restore previous conversation from localStorage exactly once.
  const initialMessages = useMemo<UIMessage[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as UIMessage[];
    } catch {
      // ignore corrupt storage
    }
    return [];
  }, []);

  const { messages, sendMessage, status, error, setMessages } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    messages: initialMessages,
  });

  // Persist messages on every change so a refresh keeps the conversation.
  useEffect(() => {
    try {
      if (messages.length === 0) {
        window.localStorage.removeItem(STORAGE_KEY);
      } else {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      }
    } catch {
      // ignore storage errors (e.g. private mode)
    }
  }, [messages]);

  // Auto-scroll to the bottom whenever a new chunk arrives.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, status]);

  // External "open the chat" trigger. Used by the command palette so
  // visitors can launch the bot from the same Cmd-K menu they use for
  // navigation. Mirrors the music:toggle / cmdk:open pattern.
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("chat:open", onOpen);
    return () => window.removeEventListener("chat:open", onOpen);
  }, []);

  const isStreaming = status === "streaming" || status === "submitted";

  const handleSend = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;
    sendMessage({ text: trimmed });
    setInput("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  const clearChat = () => {
    setMessages([]);
    setInput("");
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      {/* Floating trigger button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="trigger"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
            onClick={() => setOpen(true)}
            aria-label="Open chat with Jeet's AI assistant"
            className="pointer-events-auto group fixed right-5 bottom-5 flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/85 px-4 py-2.5 shadow-lg backdrop-blur-md transition-colors hover:border-[var(--color-accent)]"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-accent)] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-accent)]" />
            </span>
            <Sparkles className="h-3.5 w-3.5 text-[var(--color-accent)]" />
            <span className="mono text-[11px] uppercase tracking-widest text-[var(--color-fg-muted)] transition-colors group-hover:text-[var(--color-fg)]">
              ask about jeet
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
            className="pointer-events-auto fixed right-5 bottom-5 flex w-[calc(100vw-2.5rem)] max-w-[400px] flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/90 shadow-2xl backdrop-blur-xl sm:max-h-[600px]"
            style={{ height: "min(80vh, 600px)" }}
            role="dialog"
            aria-label="Chat with Jeet's AI assistant"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg)]/40 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)]">
                  <Bot className="h-4 w-4 text-[var(--color-accent)]" />
                  <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--color-bg-elevated)] bg-[var(--color-accent)]" />
                </div>
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-medium text-[var(--color-fg)]">
                    Jeet&apos;s AI
                  </span>
                  <span className="mono text-[9px] uppercase tracking-widest text-[var(--color-fg-subtle)]">
                    answers questions about jeet
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    className="mono rounded-md px-2 py-1 text-[9px] uppercase tracking-widest text-[var(--color-fg-subtle)] transition-colors hover:text-[var(--color-fg-muted)]"
                  >
                    clear
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close chat"
                  className="rounded-md p-1.5 text-[var(--color-fg-muted)] transition-colors hover:bg-[var(--color-border)] hover:text-[var(--color-fg)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Messages — `data-lenis-prevent` tells the global Lenis
                smooth-scroll handler to leave wheel/trackpad events alone
                inside this container so it scrolls natively. */}
            <div
              ref={scrollRef}
              data-lenis-prevent
              className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4"
            >
              {messages.length === 0 && (
                <EmptyState
                  onPick={(q) => handleSend(q)}
                  disabled={isStreaming}
                />
              )}
              {messages.map((m) => (
                <Message key={m.id} message={m} />
              ))}
              {error && (
                <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  Something went wrong: {error.message}. Try again in a moment.
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="flex items-center gap-2 border-t border-[var(--color-border)] bg-[var(--color-bg)]/40 px-3 py-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about Jeet's work…"
                disabled={isStreaming}
                maxLength={1500}
                className="mono flex-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4 py-2 text-xs text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] focus:border-[var(--color-accent)] focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isStreaming}
                aria-label="Send"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[var(--color-border-strong)] disabled:hover:text-[var(--color-fg-muted)]"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------

function EmptyState({
  onPick,
  disabled,
}: {
  onPick: (q: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex h-full flex-col justify-center gap-4 py-2">
      <div className="space-y-2 text-sm">
        <p className="text-[var(--color-fg)]">
          Hey — I&apos;m an AI trained on Jeet&apos;s portfolio.
        </p>
        <p className="text-[var(--color-fg-muted)]">
          Ask me about his projects, his TEDx talk, his time at CMU, or how to
          reach him.
        </p>
      </div>
      <div className="space-y-1.5">
        <p className="mono text-[9px] uppercase tracking-widest text-[var(--color-fg-subtle)]">
          // try one
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => onPick(q)}
              disabled={disabled}
              className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-[11px] text-[var(--color-fg-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Message({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const text = (message.parts ?? [])
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("");

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
          isUser
            ? "whitespace-pre-wrap bg-[var(--color-accent)]/15 text-[var(--color-fg)]"
            : "border border-[var(--color-border)] bg-[var(--color-bg)]/60 text-[var(--color-fg-muted)]"
        }`}
      >
        {isUser ? (
          text
        ) : text ? (
          <MessageMarkdown text={text} />
        ) : (
          <Typing />
        )}
      </div>
    </div>
  );
}

/**
 * Markdown renderer scoped to the chatbot panel. We override every element
 * we care about so spacing stays tight, lists actually look like lists, and
 * colors match the rest of the site (accent green, mono font for code).
 */
const MD_COMPONENTS: Components = {
  p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
  strong: ({ children }) => (
    <strong className="font-semibold text-[var(--color-fg)]">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[var(--color-accent)] underline-offset-2 hover:underline"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="my-2 ml-4 list-disc space-y-1 marker:text-[var(--color-fg-subtle)]">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-2 ml-4 list-decimal space-y-1 marker:text-[var(--color-fg-subtle)]">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  code: ({ children, className }) => {
    const isBlock = className?.includes("language-");
    if (isBlock) {
      return (
        <code className={`${className} mono text-[12px] text-[var(--color-fg)]`}>
          {children}
        </code>
      );
    }
    return (
      <code className="mono rounded bg-[var(--color-border)]/60 px-1 py-0.5 text-[12px] text-[var(--color-fg)]">
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-[var(--color-accent)] pl-3 italic text-[var(--color-fg-muted)]">
      {children}
    </blockquote>
  ),
  // Headings: chat is small, keep them subtle so a confused model that
  // emits "## Skills" doesn't blow up the layout.
  h1: ({ children }) => (
    <p className="mt-3 mb-1 text-sm font-semibold text-[var(--color-fg)] first:mt-0">
      {children}
    </p>
  ),
  h2: ({ children }) => (
    <p className="mt-3 mb-1 text-sm font-semibold text-[var(--color-fg)] first:mt-0">
      {children}
    </p>
  ),
  h3: ({ children }) => (
    <p className="mt-3 mb-1 text-sm font-semibold text-[var(--color-fg)] first:mt-0">
      {children}
    </p>
  ),
  hr: () => <hr className="my-3 border-[var(--color-border)]" />,
};

function MessageMarkdown({ text }: { text: string }) {
  return (
    <div className="space-y-0">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
        {text}
      </ReactMarkdown>
    </div>
  );
}

function Typing() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-fg-subtle)] [animation-delay:0ms]" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-fg-subtle)] [animation-delay:120ms]" />
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-fg-subtle)] [animation-delay:240ms]" />
    </span>
  );
}
