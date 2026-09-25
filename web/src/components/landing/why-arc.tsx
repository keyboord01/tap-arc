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
      <div className="mx-auto grid max-w-[1440px] grid-cols-[480px_minmax(0,1fr)] gap-24 px-[96px] py-[128px]">
        <div className="flex flex-col gap-[18px]">
          <h2 className="m-0 font-display text-[52px] leading-[1.05] font-bold tracking-[-0.03em] text-ink tabular-nums">
            Why it runs on Arc
          </h2>
          <p className="m-0 text-[19px] leading-[1.55] text-body">
            An allowance only works if spending it is instant and cheap. Arc makes both the default.
          </p>
        </div>
        <div className="flex flex-col gap-10">
          {reasons.map((r) => (
            <div key={r.title} className="flex flex-col gap-2">
              <h3 className="m-0 text-[24px] font-semibold text-ink">{r.title}</h3>
              <p className="m-0 max-w-[560px] text-[18px] leading-[1.55] text-body">{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
