"use client";

import { Command } from "cmdk";
import { useEffect, useState, type ComponentType } from "react";
import { AnimatePresence, motion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  Bot,
  BookOpen,
  Briefcase,
  FileText,
  Flag,
  Github,
  Home,
  Instagram,
  Linkedin,
  Mail,
  Mic,
  Music,
  Newspaper,
  Rocket,
  Sparkles,
  User,
} from "lucide-react";
import { profile } from "@/lib/data";

type IconCmp = ComponentType<{ className?: string }>;

interface SectionItem {
  name: string;
  id: string;
  icon: IconCmp;
  /** If set, navigate to this route instead of scrolling to an anchor. */
  route?: string;
}

const sections: SectionItem[] = [
  { name: "Top", id: "top", icon: Home },
  { name: "About", id: "about", icon: User },
  { name: "Experience", id: "experience", icon: Briefcase },
  { name: "Projects", id: "projects", icon: Rocket },
  { name: "Skills", id: "skills", icon: Sparkles },
  { name: "Talk (TEDx)", id: "talk", icon: Mic },
  { name: "Writing", id: "writing", icon: BookOpen },
  { name: "Contact", id: "contact", icon: Mail },
  { name: "Blog", id: "blog", icon: Newspaper, route: "/blog" },
];

interface QuickAction {
  name: string;
  icon: IconCmp;
  shortcut?: string;
  run: () => void;
}

const links = [
  {
    name: "GitHub",
    href: profile.socials.github,
    icon: Github,
    external: true,
  },
  {
    name: "LinkedIn",
    href: profile.socials.linkedin,
    icon: Linkedin,
    external: true,
  },
  {
    name: "Instagram",
    href: profile.socials.instagram,
    icon: Instagram,
    external: true,
  },
  {
    name: "Email",
    href: profile.socials.email,
    icon: Mail,
    external: false,
  },
  {
    name: "CTF Challenge",
    href: "/ctf",
    icon: Flag,
    external: false,
  },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    const onCustom = () => setOpen(true);
    document.addEventListener("keydown", onKey);
    window.addEventListener("cmdk:open", onCustom);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("cmdk:open", onCustom);
    };
  }, []);

  const go = (item: SectionItem) => {
    setOpen(false);
    // Section item that points at a separate route (e.g. Blog → /blog)
    if (item.route) {
      router.push(item.route);
      return;
    }
    if (pathname !== "/") {
      router.push(item.id === "top" ? "/" : `/#${item.id}`);
      return;
    }
    setTimeout(() => {
      if (item.id === "top") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        const el = document.getElementById(item.id);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
    }, 120);
  };

  /**
   * Quick actions sit above Links and bundle the things visitors most often
   * want to do that aren't navigation: download the résumé, open the AI
   * chat, toggle the lofi player. Music advertises its existing global
   * keyboard shortcut so people learn the hotkey.
   */
  const quickActions: QuickAction[] = [
    {
      name: "Download Resume",
      icon: FileText,
      run: () => {
        setOpen(false);
        window.open("/resume.pdf", "_blank", "noopener,noreferrer");
      },
    },
    {
      name: "Chat with Jeet's AI",
      icon: Bot,
      run: () => {
        setOpen(false);
        window.dispatchEvent(new CustomEvent("chat:open"));
      },
    },
    {
      name: "Play / Pause Music",
      icon: Music,
      shortcut: "M",
      run: () => {
        setOpen(false);
        window.dispatchEvent(new CustomEvent("music:toggle"));
      },
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[200] flex items-start justify-center bg-black/60 px-4 pt-[12vh] backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.96, y: -10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: -10, opacity: 0 }}
            transition={{
              type: "spring",
              damping: 28,
              stiffness: 360,
              mass: 0.7,
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-bg-elevated)] shadow-2xl shadow-black/60"
          >
            <Command label="Global command palette" loop>
              <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3">
                <span className="mono text-xs text-[var(--color-accent)]">
                  ▸
                </span>
                <Command.Input
                  placeholder="Search or jump to…"
                  className="flex-1 bg-transparent text-sm text-[var(--color-fg)] outline-none placeholder:text-[var(--color-fg-subtle)]"
                  autoFocus
                />
                <kbd className="mono rounded border border-[var(--color-border-strong)] px-1.5 py-0.5 text-[10px] text-[var(--color-fg-muted)]">
                  esc
                </kbd>
              </div>
              <Command.List
                data-lenis-prevent
                className="max-h-[50vh] overflow-y-auto overscroll-contain p-2"
              >
                <Command.Empty className="px-3 py-8 text-center text-sm text-[var(--color-fg-muted)]">
                  No results.
                </Command.Empty>

                <Command.Group
                  heading="Sections"
                  className="mono text-[10px] uppercase tracking-widest text-[var(--color-fg-subtle)] [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2"
                >
                  {sections.map((s) => {
                    const Icon = s.icon;
                    return (
                      <Command.Item
                        key={s.id}
                        value={s.name}
                        onSelect={() => go(s)}
                        className="group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm text-[var(--color-fg-muted)] data-[selected=true]:bg-[var(--color-border)] data-[selected=true]:text-[var(--color-fg)]"
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="h-4 w-4" />
                          {s.name}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-data-[selected=true]:opacity-100" />
                      </Command.Item>
                    );
                  })}
                </Command.Group>

                <Command.Group
                  heading="Quick Actions"
                  className="mono text-[10px] uppercase tracking-widest text-[var(--color-fg-subtle)] [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2"
                >
                  {quickActions.map((a) => {
                    const Icon = a.icon;
                    return (
                      <Command.Item
                        key={a.name}
                        value={a.name}
                        onSelect={() => a.run()}
                        className="group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm text-[var(--color-fg-muted)] data-[selected=true]:bg-[var(--color-border)] data-[selected=true]:text-[var(--color-fg)]"
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="h-4 w-4" />
                          {a.name}
                        </span>
                        {a.shortcut ? (
                          <kbd className="mono rounded border border-[var(--color-border-strong)] px-1.5 py-0.5 text-[10px] text-[var(--color-fg-muted)]">
                            {a.shortcut}
                          </kbd>
                        ) : (
                          <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-data-[selected=true]:opacity-100" />
                        )}
                      </Command.Item>
                    );
                  })}
                </Command.Group>

                <Command.Group
                  heading="Links"
                  className="mono text-[10px] uppercase tracking-widest text-[var(--color-fg-subtle)] [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2"
                >
                  {links.map((l) => {
                    const Icon = l.icon;
                    return (
                      <Command.Item
                        key={l.name}
                        value={l.name}
                        onSelect={() => {
                          setOpen(false);
                          if (l.external) {
                            window.open(l.href, "_blank", "noopener,noreferrer");
                          } else {
                            window.location.href = l.href;
                          }
                        }}
                        className="group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm text-[var(--color-fg-muted)] data-[selected=true]:bg-[var(--color-border)] data-[selected=true]:text-[var(--color-fg)]"
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="h-4 w-4" />
                          {l.name}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-data-[selected=true]:opacity-100" />
                      </Command.Item>
                    );
                  })}
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
