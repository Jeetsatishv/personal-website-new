import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().max(120),
  message: z.string().min(10).max(2000),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid form data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    const toEmail = process.env.CONTACT_TO_EMAIL || "jeetsatishv@gmail.com";
    const fromEmail = process.env.CONTACT_FROM_EMAIL || "onboarding@resend.dev";

    if (!apiKey) {
      // Graceful fallback: log in dev so form can still be tested
      console.warn(
        "[contact] RESEND_API_KEY not set — message dropped:",
        parsed.data,
      );
      return NextResponse.json(
        {
          error:
            "Email service not configured. Please email jeetsatishv@gmail.com directly.",
        },
        { status: 503 },
      );
    }

    const resend = new Resend(apiKey);
    const { name, email, message } = parsed.data;

    const { error } = await resend.emails.send({
      from: `Portfolio <${fromEmail}>`,
      to: [toEmail],
      replyTo: email,
      subject: `New message from ${name}`,
      text: `From: ${name} <${email}>\n\n${message}`,
      html: `
        <div style="font-family: ui-monospace, Menlo, monospace; background:#0a0a0b; color:#f5f5f7; padding:32px; border-radius:12px;">
          <p style="color:#34d399; font-size:11px; text-transform:uppercase; letter-spacing:0.2em; margin:0 0 16px;">// new message</p>
          <p style="margin:0 0 8px;"><strong>${name}</strong> &lt;${email}&gt;</p>
          <div style="border-top:1px solid #1f1f23; margin:16px 0; padding-top:16px; white-space:pre-wrap;">${message.replace(/</g, "&lt;")}</div>
        </div>
      `,
    });

    if (error) {
      console.error("[contact] Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send. Try emailing directly." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[contact] Unexpected error:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 },
    );
  }
}
