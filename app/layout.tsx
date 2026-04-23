import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SmoothScroll } from "@/components/SmoothScroll";
import { Cursor } from "@/components/Cursor";
import { GrainOverlay } from "@/components/GrainOverlay";
import { Navbar } from "@/components/Navbar";
import { CommandPalette } from "@/components/CommandPalette";
import { KonamiEasterEgg } from "@/components/KonamiEasterEgg";
import { ConsoleSignature } from "@/components/ConsoleSignature";
import { BackgroundMusic } from "@/components/BackgroundMusic";
import { HashScroll } from "@/components/HashScroll";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { Analytics } from "@vercel/analytics/next";
import { profile } from "@/lib/data";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://jeetcreates.com"),
  title: {
    default: `${profile.name} — ${profile.role}`,
    template: `%s · ${profile.name}`,
  },
  description: profile.bio,
  keywords: [
    "Jeet Vijaywargi",
    "Cybersecurity",
    "AI Engineering",
    "Carnegie Mellon",
    "SOC Analyst",
    "Information Security",
    "Incident Response",
    "Machine Learning",
  ],
  authors: [{ name: profile.name, url: profile.socials.linkedin }],
  creator: profile.name,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://jeetcreates.com",
    title: `${profile.name} — ${profile.role}`,
    description: profile.bio,
    siteName: profile.name,
  },
  twitter: {
    card: "summary_large_image",
    title: `${profile.name} — ${profile.role}`,
    description: profile.bio,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <SmoothScroll>
          <GrainOverlay />
          <Cursor />
          <Navbar />
          <main>{children}</main>
          <CommandPalette />
          <BackgroundMusic />
          <HashScroll />
          <KeyboardShortcuts />
          <KonamiEasterEgg />
          <ConsoleSignature />
        </SmoothScroll>
        <Analytics />
      </body>
    </html>
  );
}
