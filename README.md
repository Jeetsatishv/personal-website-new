# Jeet Vijaywargi — Personal Website

Modern dark, mono + terminal-accent portfolio built with Next.js 15, Motion, and
Three.js.

## Stack

- **Next.js 15** (App Router, React 18)
- **Tailwind CSS v4** (`@import "tailwindcss"`, zero-config PostCSS)
- **Motion** (`motion/react`, formerly Framer Motion) — animations
- **Lenis** — smooth scroll
- **@react-three/fiber + drei** — 3D hero shape
- **cmdk** — ⌘K command palette
- **MDX** (`next-mdx-remote`) — blog posts in `content/posts/`
- **Resend** — contact form email
- **Vercel** — deploy target

## Getting Started

```bash
npm install --legacy-peer-deps
cp .env.local.example .env.local  # add your Resend key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Structure

```
app/                  # Next.js app router
  layout.tsx          # Root — fonts, cursor, smooth scroll, palette
  page.tsx            # Landing (composes all sections)
  globals.css         # Tailwind v4 + design tokens
  opengraph-image.tsx # Dynamic OG image
  api/contact/        # Resend-powered contact endpoint
  blog/               # /blog index + /blog/[slug]
sections/             # Page sections (Hero, About, Experience, ...)
components/           # Shared UI (Cursor, Navbar, ProjectCard, ...)
components/three/     # WebGL scene
content/posts/        # MDX blog posts
lib/                  # data.ts (content) + mdx.ts + utils.ts
public/               # resume.pdf, static assets
```

## Editing content

Almost everything lives in **`lib/data.ts`** — profile, education, experience,
projects, skills, achievements. Update values there and the sections re-render
automatically.

## Environment variables

```env
RESEND_API_KEY=re_...                   # https://resend.com (free 3k/month)
CONTACT_TO_EMAIL=jeetsatishv@gmail.com  # where messages land
CONTACT_FROM_EMAIL=onboarding@resend.dev # use this while testing (verify a domain later)
```

Without a `RESEND_API_KEY`, the contact form renders, but submissions return a
friendly 503 and the user sees a mailto fallback link.

## Writing a blog post

1. Drop a new `.mdx` file in `content/posts/`:

   ```mdx
   ---
   title: "My Post"
   description: "One-line description"
   date: "2026-05-01"
   tags: ["security", "notes"]
   ---

   # Hello

   Your MDX content here.
   ```

2. Visit `/blog/my-post`. The index at `/blog` lists all posts automatically
   (sorted newest first).

## Keyboard

- **⌘K / Ctrl+K** — Command palette (jump anywhere)
- **↑↑↓↓←→←→BA** — 🔒 try it

## Deploy to Vercel

```bash
vercel login
vercel            # preview
vercel --prod     # production
```

Then point `jeetcreates.com` A/CNAME records at Vercel. Add env vars (`RESEND_API_KEY`, etc.) in
the Vercel project settings.

## Notes

- The 3D hero is swapped for a static gradient on mobile (`<= 768px`) to keep
  the page light.
- All animations respect `prefers-reduced-motion`.
- If you run into a `@react-three/fiber` peer-dep error, reinstall with
  `--legacy-peer-deps`.
