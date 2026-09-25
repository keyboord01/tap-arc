import { container } from "./layout";
import { LogoMark } from "./logo-mark";
import { GITHUB_URL, X_URL } from "@/lib/links";
import { cn } from "@/lib/utils";

export function Footer() {
  return (
    <footer className="border-t border-track bg-footer text-[15px] text-sage">
      <div className={cn(container, "flex flex-col items-start gap-4 py-10 sm:flex-row sm:justify-between")}>
        <div className="flex items-center gap-2.5">
          <LogoMark size={24} />
          <span>Tap, built on Arc. Not affiliated with Circle.</span>
        </div>
        <div className="flex gap-7">
          <a className="text-fog no-underline hover:text-white" href={GITHUB_URL}>
            GitHub
          </a>
          {X_URL && (
            <a className="text-fog no-underline hover:text-white" href={X_URL}>
              X
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
