import { container, sectionHeading } from "./layout";
import { cn } from "@/lib/utils";

const reasons = [
  {
    title: "USDC pays the gas",
    text: "Spenders only ever hold USDC. Nobody has to buy a second token before they can use their allowance.",
  },
  {
    title: "Final the moment it lands",
    text: "Arc finalizes a transaction as soon as it's included in a block. No reorgs and no confirmation countdown.",
  },
  {
    title: "Fees small enough for small budgets",
    text: "A spend costs about a tenth of a cent, so a 5 USDC daily allowance still makes sense.",
  },
];

export function WhyArc() {
  return (
    <section id="why" className="bg-mist">
      <div className={cn(container, "grid grid-cols-1 gap-12 py-[clamp(72px,8.8889vw,128px)] min-[1100px]:grid-cols-[480px_minmax(0,1fr)] min-[1100px]:gap-[clamp(48px,6.6667vw,96px)]")}>
        <div className="flex flex-col gap-[18px]">
          <h2 className={sectionHeading}>
            Why it runs on Arc
          </h2>
          <p className="m-0 text-[clamp(17px,1.3195vw,19px)] leading-[1.55] text-body">
            An allowance only works if spending it is instant and cheap. Arc makes both the default.
          </p>
        </div>
        <div className="flex flex-col gap-10">
          {reasons.map((r) => (
            <div key={r.title} className="flex flex-col gap-2">
              <h3 className="m-0 text-[clamp(21px,1.6667vw,24px)] font-semibold text-ink">{r.title}</h3>
              <p className="m-0 max-w-[560px] text-[clamp(16px,1.25vw,18px)] leading-[1.55] text-body">{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
