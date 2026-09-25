import type { ReactNode } from "react";

import { LinkButton } from "./buttons";
import { container } from "./layout";
import { Nav } from "./nav";
import { APP_PATH } from "@/lib/links";
import { cn } from "@/lib/utils";

export function Hero({
  contractUrl,
  reel,
  testnetUrl,
}: {
  contractUrl: string;
  reel: ReactNode;
  testnetUrl?: string;
}) {
  return (
    <section id="top" className="bg-ink text-paper">
      {/* The design file declares 980px, but its fixed 3600px page squeezes the hero to 943px as rendered. */}
      <div
        className={cn(
          container,
          "flex flex-col pb-16 min-[1100px]:h-[943px] min-[1100px]:pb-0",
        )}
      >
        <Nav />
        <div className="flex grow flex-col gap-12 pt-6 min-[1100px]:flex-row min-[1100px]:items-center min-[1100px]:justify-between min-[1100px]:pt-0">
          <div className="flex w-full flex-col gap-7 min-[1100px]:w-[500px]">
            <h1 className="m-0 font-display text-[clamp(42px,4.7223vw,68px)] leading-none font-bold tracking-[-0.035em] text-paper tabular-nums">
              Spending limits for USDC, enforced by the chain.
            </h1>
            <p className="m-0 max-w-[460px] text-[clamp(17px,1.3195vw,19px)] leading-[1.55] text-fog">
              Put USDC in a vault and give someone an allowance, like 20 USDC
              every 7 days until the end of the year. The contract holds the
              line, and you can pause, edit, or revoke it at any moment.
            </p>
            <div className="flex flex-wrap gap-3.5 pt-1.5">
              <LinkButton variant="primary" href={APP_PATH}>
                Open Tap
              </LinkButton>
              <LinkButton variant="ghost" href={contractUrl}>
                Read the contract
              </LinkButton>
            </div>
            <p className="m-0 text-[15px] text-sage">
              Open source, built on Arc.
              {testnetUrl && (
                <>
                  {" "}
                  <a
                    href={`${testnetUrl}/app`}
                    className="text-fog underline-offset-4 hover:text-white hover:underline"
                  >
                    Try it on testnet
                  </a>
                </>
              )}
            </p>
          </div>
          {reel}
        </div>
      </div>
    </section>
  );
}
