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
      <div className="mx-auto flex max-w-[1440px] flex-col gap-16 px-[96px] pt-[128px] pb-[120px]">
        <h2 className="m-0 max-w-[720px] font-display text-[52px] leading-[1.05] font-bold tracking-[-0.03em] text-ink tabular-nums">
          Three steps, then the contract does the rest.
        </h2>
        <div className="grid grid-cols-3 gap-12">
          {steps.map((step, i) => (
            <div key={step.title} className="flex flex-col gap-3.5 border-t-2 border-ink pt-7">
              <span className="font-display text-[80px] leading-none font-bold text-brand tabular-nums">{i + 1}</span>
              <h3 className="m-0 text-[24px] font-semibold text-ink">{step.title}</h3>
              <p className="m-0 max-w-[360px] text-[18px] leading-[1.55] text-body">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
