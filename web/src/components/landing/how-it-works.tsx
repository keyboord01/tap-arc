import { container, sectionHeading } from "./layout";
import { cn } from "@/lib/utils";

const steps = [
  {
    title: "Fill your vault",
    text: "Deposit USDC from your wallet. Anything that isn't spent stays yours to withdraw, whenever you want.",
  },
  {
    title: "Open a tap",
    text: "Choose an address and a rule: how much, how often it resets, and an end date if you want one.",
  },
  {
    title: "Let them spend",
    text: "They can spend up to the limit and not a cent more. Pause, edit, or revoke the tap in one transaction.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="bg-mist">
      <div className={cn(container, "flex flex-col gap-[clamp(40px,4.4445vw,64px)] pt-[clamp(72px,8.8889vw,128px)] pb-[clamp(64px,8.3334vw,120px)]")}>
        <h2 className={cn(sectionHeading, "max-w-[720px]")}>
          Three steps, then the contract does the rest.
        </h2>
        <div className="grid grid-cols-1 gap-12 min-[900px]:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.title} className="flex flex-col gap-3.5 border-t-2 border-ink pt-7">
              <span className="font-display text-[clamp(60px,5.5556vw,80px)] leading-none font-bold text-brand tabular-nums">{i + 1}</span>
              <h3 className="m-0 text-[clamp(21px,1.6667vw,24px)] font-semibold text-ink">{step.title}</h3>
              <p className="m-0 max-w-[360px] text-[clamp(16px,1.25vw,18px)] leading-[1.55] text-body">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
