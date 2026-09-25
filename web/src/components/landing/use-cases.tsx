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
      <div className="mx-auto flex max-w-[1440px] flex-col gap-14 px-[96px] py-[120px]">
        <div className="flex flex-col gap-3.5">
          <h2 className="m-0 font-display text-[52px] leading-[1.05] font-bold tracking-[-0.03em] text-ink tabular-nums">
            One vault, a tap for everyone.
          </h2>
          <p className="m-0 text-[19px] leading-[1.55] text-body">
            Each spender gets their own rule, and nobody can touch anyone else&apos;s.
          </p>
        </div>
        <div className="flex flex-col">
          {cases.map((c, i) => (
            <div
              key={c.title}
              className={cn(
                "grid grid-cols-[300px_minmax(0,1fr)_320px] items-center gap-12 border-t border-rule py-9",
                i === cases.length - 1 && "border-b",
              )}
            >
              <h3 className="m-0 font-display text-[30px] font-semibold tracking-[-0.02em] text-ink tabular-nums">
                {c.title}
              </h3>
              <p className="m-0 max-w-[520px] text-[18px] leading-[1.55] text-body">{c.text}</p>
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
    <div className="box-border flex w-[320px] flex-col gap-3 rounded-[18px] bg-ink px-[22px] py-[18px]">
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
