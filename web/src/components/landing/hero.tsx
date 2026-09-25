import type { ReactNode } from "react";

import { LinkButton } from "./buttons";
import { Nav } from "./nav";
import { APP_PATH } from "@/lib/links";

export function Hero({ contractUrl, reel }: { contractUrl: string; reel: ReactNode }) {
  return (
    <section id="top" className="bg-ink text-paper">
      <div className="mx-auto flex h-[943px] max-w-[1440px] flex-col px-[96px]">
        <Nav />
        <div className="flex grow items-center justify-between gap-12">
          <div className="flex w-[500px] flex-col gap-7">
            <h1 className="m-0 font-display text-[68px] leading-none font-bold tracking-[-0.035em] text-paper tabular-nums">
              Spending limits for USDC, enforced by the chain.
            </h1>
            <p className="m-0 max-w-[460px] text-[19px] leading-[1.55] text-fog">
              Put USDC in a vault and give someone an allowance, like 20 USDC every 7 days until the end of the year.
              The contract holds the line, and you can pause, edit, or revoke it at any moment.
            </p>
            <div className="flex gap-3.5 pt-1.5">
              <LinkButton variant="primary" href={APP_PATH}>
                Open Tap
              </LinkButton>
              <LinkButton variant="ghost" href={contractUrl}>
                Read the contract
              </LinkButton>
            </div>
            <p className="m-0 text-[15px] text-sage">Open source, built on Arc.</p>
          </div>
          {reel}
        </div>
      </div>
    </section>
  );
}
