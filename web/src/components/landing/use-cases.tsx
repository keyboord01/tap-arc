import { container, sectionHeading } from "./layout";
import { cn } from "@/lib/utils";

const cases = [
  {
    title: "Family and friends",
    text: "A weekly allowance for a sibling studying abroad, without sending money every Sunday night.",
    rule: "20 USDC every 7 days",
    used: "35%",
  },
  {
    title: "Freelancers",
    text: "A monthly budget for tools and ads that a contractor can use without asking you before every purchase.",
    rule: "300 USDC every 30 days",
    used: "60%",
  },
  {
    title: "AI agents",
    text: "A hard daily cap for an agent that pays for APIs. However it gets prompted, it can't spend past the limit.",
    rule: "5 USDC every day",
    limitReached: true,
  },
];

export function UseCases() {
  return (
    <section id="who" className="bg-mist-2">
      <div className={cn(container, "flex flex-col gap-[clamp(40px,3.8889vw,56px)] py-[clamp(64px,8.3334vw,120px)]")}>
        <div className="flex flex-col gap-3.5">
          <h2 className={sectionHeading}>
            One vault, a tap for everyone.
          </h2>
          <p className="m-0 text-[clamp(17px,1.3195vw,19px)] leading-[1.55] text-body">
            Each spender gets their own rule, and nobody can touch anyone else&apos;s.
          </p>
        </div>
        <div className="flex flex-col">
          {cases.map((c, i) => (
            <div
              key={c.title}
              className={cn(
                "grid grid-cols-1 gap-4 border-t border-rule py-9 min-[1100px]:grid-cols-[300px_minmax(0,1fr)_320px] min-[1100px]:items-center min-[1100px]:gap-12",
                i === cases.length - 1 && "border-b",
              )}
            >
              <h3 className="m-0 font-display text-[clamp(24px,2.0834vw,30px)] font-semibold tracking-[-0.02em] text-ink tabular-nums">
                {c.title}
              </h3>
              <p className="m-0 max-w-[520px] text-[clamp(16px,1.25vw,18px)] leading-[1.55] text-body">{c.text}</p>
              <RulePill {...c} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RulePill({ rule, used, limitReached }: { rule: string; used?: string; limitReached?: boolean }) {
  return (
    <div className="mt-2 box-border flex w-full max-w-[320px] flex-col gap-3 min-[1100px]:mt-0 min-[1100px]:w-[320px] rounded-[18px] bg-ink px-[22px] py-[18px]">
      {limitReached ? (
        <div className="flex items-center justify-between">
          <span className="text-[17px] font-semibold text-paper">{rule}</span>
          <span className="rounded-[12px] bg-amber px-2.5 py-1 text-[13px] font-bold text-amber-ink">Limit reached</span>
        </div>
      ) : (
        <span className="text-[17px] font-semibold text-paper">{rule}</span>
      )}
      {limitReached ? (
        <div className="h-1.5 rounded-[3px] bg-amber" />
      ) : (
        <div className="h-1.5 rounded-[3px] bg-track">
          <div className="h-1.5 rounded-[3px] bg-mint" style={{ width: used }} />
        </div>
      )}
    </div>
  );
}
