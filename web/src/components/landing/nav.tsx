import { LogoMark } from "./logo-mark";
import { GITHUB_URL } from "@/lib/links";

const sections = [
  { href: "#how", label: "How it works" },
  { href: "#who", label: "Use cases" },
  { href: "#why", label: "Why Arc" },
];

export function Nav() {
  return (
    <nav className="flex h-[96px] items-center justify-between" aria-label="Main">
      <a href="#top" className="flex items-center gap-3 text-paper no-underline" aria-label="Tap home">
        <LogoMark />
        <span className="font-display text-[26px] font-bold tracking-[-0.02em]">Tap</span>
      </a>
      <div className="flex items-center gap-9 text-[16px]">
        {sections.map((s) => (
          <a key={s.href} className="text-fog no-underline hover:text-white" href={s.href}>
            {s.label}
          </a>
        ))}
        <a
          href={GITHUB_URL}
          className="flex h-[44px] items-center rounded-[12px] border-[1.5px] border-line px-5 font-semibold text-paper no-underline transition-[border-color,background-color] duration-200 ease-in-out hover:border-mint hover:bg-mint/8 hover:text-paper"
        >
          GitHub
        </a>
      </div>
    </nav>
  );
}
