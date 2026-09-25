import { LogoMark } from "./logo-mark";
import { GITHUB_URL, X_URL } from "@/lib/links";

export function Footer() {
  return (
    <footer className="border-t border-track bg-footer text-[15px] text-sage">
      <div className="mx-auto flex max-w-[1440px] items-start justify-between px-[96px] py-10">
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
