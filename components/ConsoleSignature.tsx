"use client";

import { useEffect } from "react";

const BANNER = `
 ██╗███████╗███████╗████████╗
 ██║██╔════╝██╔════╝╚══██╔══╝
 ██║█████╗  █████╗     ██║
██║ ██║██╔══╝  ██╔══╝     ██║
╚█████╔╝███████╗███████╗   ██║
 ╚════╝ ╚══════╝╚══════╝   ╚═╝
`;

export function ConsoleSignature() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const styleHeader = "color:#34d399;font-family:monospace;font-size:12px;";
    const styleBody = "color:#a1a1aa;font-family:monospace;";
    // eslint-disable-next-line no-console
    console.log(`%c${BANNER}`, styleHeader);
    // eslint-disable-next-line no-console
    console.log(
      "%c> Hey, you're in the console. Respect.\n> Try the Konami code on the page. ↑↑↓↓←→←→BA\n> A flag hides somewhere on this site. Start at /ctf.\n> Reach me: jeetsatishv@gmail.com",
      styleBody,
    );
  }, []);

  return null;
}
