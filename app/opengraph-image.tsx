import { ImageResponse } from "next/og";
import { profile } from "@/lib/data";

export const runtime = "edge";
export const alt = `${profile.name} — ${profile.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0a0a0b",
          color: "#f5f5f7",
          padding: 72,
          fontFamily: "monospace",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 32,
            border: "1px solid #2a2a2f",
            borderRadius: 24,
          }}
        />
        <div
          style={{
            fontSize: 16,
            color: "#34d399",
            letterSpacing: 4,
            textTransform: "uppercase",
            marginBottom: 24,
          }}
        >
          ▸ personal portfolio
        </div>
        <div
          style={{
            fontSize: 104,
            fontWeight: 600,
            lineHeight: 1,
            letterSpacing: -4,
            marginBottom: 16,
          }}
        >
          {profile.name}
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#a1a1aa",
            marginBottom: "auto",
          }}
        >
          {profile.role}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 20,
            color: "#71717a",
          }}
        >
          <span>{profile.location}</span>
          <span style={{ color: "#34d399" }}>jeetcreates.com</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
