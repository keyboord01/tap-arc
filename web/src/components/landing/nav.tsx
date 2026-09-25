"use client";

import { useEffect, useId, useState } from "react";

import { LogoMark } from "./logo-mark";
import { GITHUB_URL } from "@/lib/links";
import { cn } from "@/lib/utils";

const sections = [
  { href: "#how", label: "How it works" },
  { href: "#who", label: "Use cases" },
  { href: "#why", label: "Why Arc" },
];

const ghostSmall =
  "flex h-[44px] items-center rounded-[12px] border-[1.5px] border-line px-5 font-semibold text-paper no-underline transition-[border-color,background-color] duration-200 ease-in-out hover:border-mint hover:bg-mint/8 hover:text-paper";

export function Nav() {
  const [open, setOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <nav className="relative flex h-[96px] items-center justify-between" aria-label="Main">
      <a href="#top" className="flex items-center gap-3 text-paper no-underline" aria-label="Tap home">
        <LogoMark />
        <span className="font-display text-[26px] font-bold tracking-[-0.02em]">Tap</span>
      </a>

      <div className="hidden items-center gap-9 text-[16px] md:flex">
        {sections.map((s) => (
          <a key={s.href} className="text-fog no-underline hover:text-white" href={s.href}>
            {s.label}
          </a>
        ))}
        <a href={GITHUB_URL} className={ghostSmall}>
          GitHub
        </a>
      </div>

      <button
        type="button"
        className={cn(ghostSmall, "md:hidden")}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "Close" : "Menu"}
      </button>
      <div
        id={menuId}
        hidden={!open}
        className="absolute top-[84px] right-0 left-0 z-10 flex-col gap-1 rounded-[18px] border border-track bg-panel p-3 text-[17px] shadow-xl [&:not([hidden])]:flex md:hidden"
      >
        {[...sections, { href: GITHUB_URL, label: "GitHub" }].map((s) => (
          <a
            key={s.href}
            href={s.href}
            onClick={() => setOpen(false)}
            className="rounded-[12px] px-4 py-3 text-paper no-underline hover:bg-chip hover:text-white"
          >
            {s.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
