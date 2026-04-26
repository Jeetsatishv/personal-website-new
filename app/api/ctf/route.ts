import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

const FLAG = "JV{y0u_f0und_th3_sh4d0w}";

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().max(120),
  flag: z.string().min(4).max(200),
  // Optional one-liner the solver can leave for Jeet. Capped to keep the
  // notification email tight and discourage anyone from stuffing the
  // endpoint with arbitrary text.
  message: z.string().max(1000).optional(),
});

function normalize(input: string) {
  return input.trim().replace(/\s+/g, "");
}

/**
 * Tiny HTML escape so user-provided text (especially the free-form
 * message field) can't break out of the template into the rendered email.
 */
function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Missing or invalid fields" },
        { status: 400 },
      );
    }

    const { name, email, flag, message } = parsed.data;
    const trimmedMessage = message?.trim() || "";
    if (normalize(flag) !== FLAG) {
      return NextResponse.json(
        { error: "Flag didn't match. Keep looking." },
        { status: 400 },
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    const toEmail = process.env.CONTACT_TO_EMAIL || "jeetsatishv@gmail.com";
    const fromEmail =
      process.env.CONTACT_FROM_EMAIL || "onboarding@resend.dev";

    if (apiKey) {
      const resend = new Resend(apiKey);
      const textBody =
        `${name} <${email}> submitted the correct flag on jeetcreates.com.\n\n` +
        `Flag: ${flag}` +
        (trimmedMessage ? `\n\nMessage:\n${trimmedMessage}` : "");
      const messageHtmlBlock = trimmedMessage
        ? `
            <div style="border-top:1px solid #1f1f23; margin:16px 0; padding-top:16px;">
              <p style="margin:0 0 8px; color:#a1a1aa;">Message from solver:</p>
              <p style="margin:0; white-space:pre-wrap; color:#f5f5f7;">${escapeHtml(trimmedMessage)}</p>
            </div>`
        : "";
      const { error } = await resend.emails.send({
        from: `Portfolio CTF <${fromEmail}>`,
        to: [toEmail],
        replyTo: email,
        subject: `[CTF] ${name} captured the flag`,
        text: textBody,
        html: `
          <div style="font-family: ui-monospace, Menlo, monospace; background:#0a0a0b; color:#f5f5f7; padding:32px; border-radius:12px;">
            <p style="color:#34d399; font-size:11px; text-transform:uppercase; letter-spacing:0.2em; margin:0 0 16px;">// ctf captured</p>
            <p style="margin:0 0 8px;"><strong>${escapeHtml(name)}</strong> &lt;${escapeHtml(email)}&gt;</p>
            <div style="border-top:1px solid #1f1f23; margin:16px 0; padding-top:16px;">
              <p style="margin:0 0 8px; color:#a1a1aa;">Flag submitted:</p>
              <code style="color:#34d399;">${escapeHtml(flag)}</code>
            </div>
            ${messageHtmlBlock}
          </div>
        `,
      });
      if (error) {
        console.error("[ctf] Resend error:", error);
      }
    } else {
      console.warn("[ctf] RESEND_API_KEY not set — capture not emailed:", {
        name,
        email,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[ctf] Unexpected error:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 },
    );
  }
}
