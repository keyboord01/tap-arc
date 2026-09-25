import { LinkButton } from "./buttons";
import { ContractAddress } from "./contract-address";
import { APP_PATH, GITHUB_URL } from "@/lib/links";

export function Cta({ address, explorerHref, networkLabel }: { address?: string; explorerHref?: string; networkLabel: string }) {
  return (
    <section className="bg-ink">
      <div className="mx-auto flex max-w-[1440px] items-end justify-between gap-16 px-[96px] py-[136px]">
        <div className="flex flex-col gap-5">
          <h2 className="m-0 font-display text-[96px] leading-[0.95] font-bold tracking-[-0.045em] text-paper tabular-nums">
            Open a tap.
          </h2>
          <p className="m-0 text-[19px] leading-[1.55] text-fog">
            Tap is open source.
            {address && (
              <>
                {" "}
                Contract on {networkLabel}: <ContractAddress address={address} href={explorerHref} />
              </>
            )}
          </p>
        </div>
        <div className="flex gap-3.5">
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
