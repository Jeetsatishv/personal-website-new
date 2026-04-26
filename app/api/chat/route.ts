/**
 * Chat endpoint for the website chatbot.
 *
 * - Streams tokens back via the AI SDK's UI message stream protocol so the
 *   client (`useChat` hook) can render partial responses as they arrive.
 * - Runs on Edge for latency and cheap idle cost.
 * - Soft per-IP rate limit using an in-memory sliding window. Best-effort
 *   only (Edge instances aren't shared globally), but enough to deter a
 *   bored visitor from running up the OpenAI bill.
 */

import { google } from "@ai-sdk/google";
import {
  convertToModelMessages,
  streamText,
  type UIMessage,
} from "ai";
import { getSystemPrompt } from "@/lib/chatContext";

export const runtime = "edge";
export const maxDuration = 30;

// ---- Rate limit -----------------------------------------------------------

const RATE_LIMIT_MAX = 10; // messages per window
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

function clientId(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "anon";
}

function checkRate(id: string): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const b = buckets.get(id);
  if (!b || b.resetAt < now) {
    buckets.set(id, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { ok: true, retryAfter: 0 };
  }
  if (b.count >= RATE_LIMIT_MAX) {
    return { ok: false, retryAfter: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count += 1;
  return { ok: true, retryAfter: 0 };
}

// ---- Handler --------------------------------------------------------------

export async function POST(req: Request) {
  // The @ai-sdk/google provider reads GOOGLE_GENERATIVE_AI_API_KEY by default.
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return new Response(
      "GOOGLE_GENERATIVE_AI_API_KEY is not configured.",
      { status: 500 },
    );
  }

  const id = clientId(req);
  const rate = checkRate(id);
  if (!rate.ok) {
    return new Response(
      JSON.stringify({
        error: "rate_limited",
        message: `You're sending messages a bit fast — try again in ~${rate.retryAfter}s.`,
      }),
      { status: 429, headers: { "Content-Type": "application/json" } },
    );
  }

  let body: { messages: UIMessage[] };
  try {
    body = (await req.json()) as { messages: UIMessage[] };
  } catch {
    return new Response("Bad JSON", { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return new Response("Missing messages", { status: 400 });
  }

  // Soft cap: most recent 10 turns is more than enough context.
  const recent = body.messages.slice(-10);

  // Per-message length sanity check on the latest user message.
  const last = recent[recent.length - 1];
  const lastText = last?.parts
    ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join(" ");
  if (lastText && lastText.length > 1500) {
    return new Response(
      JSON.stringify({
        error: "too_long",
        message: "Please keep messages under ~1500 characters.",
      }),
      { status: 413, headers: { "Content-Type": "application/json" } },
    );
  }

  const modelMessages = await convertToModelMessages(recent);

  // Default to gemini-2.5-flash — fits well in the free tier and is fast
  // enough for FAQ-style streaming. AI Pro accounts can override with a
  // beefier model (e.g. gemini-2.5-pro) via the env var.
  //
  // Why the providerOptions block:
  //  • Gemini 2.5 Flash is a "thinking" model by default — it spends part of
  //    the output-token budget on internal reasoning before producing the
  //    visible answer. For FAQ chat that's both unnecessary AND it caused
  //    answers to truncate mid-bullet because reasoning ate the budget.
  //    `thinkingBudget: 0` disables it. (Pro doesn't accept 0 — leave it
  //    at the model default if you flip GEMINI_CHAT_MODEL to pro.)
  //  • includeThoughts: false ensures no chain-of-thought leaks into the
  //    streamed response.
  const result = streamText({
    model: google(process.env.GEMINI_CHAT_MODEL || "gemini-2.5-flash"),
    system: getSystemPrompt(),
    messages: modelMessages,
    // Bumped from 600 — gives complex answers (project lists, etc.) room
    // to finish without bloating typical short replies.
    maxOutputTokens: 1500,
    temperature: 0.5,
    providerOptions: {
      google: {
        thinkingConfig: {
          thinkingBudget: 0,
          includeThoughts: false,
        },
      },
    },
  });

  return result.toUIMessageStreamResponse();
}
