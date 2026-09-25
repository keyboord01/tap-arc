import { LinkButton } from "./buttons";
import { ContractAddress } from "./contract-address";
import { container } from "./layout";
import { APP_PATH, GITHUB_URL } from "@/lib/links";
import { cn } from "@/lib/utils";

export function Cta({ address, explorerHref, networkLabel }: { address?: string; explorerHref?: string; networkLabel: string }) {
  return (
    <section className="bg-ink">
      <div className={cn(container, "flex flex-col items-start gap-10 py-[clamp(80px,9.4445vw,136px)] min-[1100px]:flex-row min-[1100px]:items-end min-[1100px]:justify-between min-[1100px]:gap-16")}>
        <div className="flex flex-col gap-5">
          <h2 className="m-0 font-display text-[clamp(56px,6.6667vw,96px)] leading-[0.95] font-bold tracking-[-0.045em] text-paper tabular-nums">
            Open a tap.
          </h2>
          <p className="m-0 text-[clamp(17px,1.3195vw,19px)] leading-[1.55] text-fog">
            Tap is open source.
            {address && (
              <>
                {" "}
                Contract on {networkLabel}: <ContractAddress address={address} href={explorerHref} />
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-3.5">
          <LinkButton variant="primary" size="lg" href={APP_PATH}>
            Open Tap
          </LinkButton>
          <LinkButton variant="ghost" size="lg" href={GITHUB_URL}>
            View on GitHub
          </LinkButton>
        </div>
      </div>
    </section>
  );
}
