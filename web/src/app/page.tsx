import { Cta } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Reel } from "@/components/landing/reel";
import { UseCases } from "@/components/landing/use-cases";
import { WhyArc } from "@/components/landing/why-arc";
import { addressUrl, network, networkSites, tapAddress } from "@/lib/config";
import { CONTRACT_SOURCE_URL } from "@/lib/links";

const networkLabel =
  network === "mainnet"
    ? "Arc mainnet"
    : network === "testnet"
      ? "Arc testnet"
      : "a local chain";

export default function Landing() {
  const explorerHref = tapAddress ? addressUrl(tapAddress) : undefined;
  return (
    <div className="landing bg-ink font-sans text-ink antialiased">
      <Hero
        contractUrl={explorerHref ?? CONTRACT_SOURCE_URL}
        reel={<Reel />}
        testnetUrl={network === "mainnet" ? networkSites.testnet : undefined}
      />
      <HowItWorks />
      <UseCases />
      <WhyArc />
      <Cta
        address={tapAddress}
        explorerHref={explorerHref}
        networkLabel={networkLabel}
      />
      <Footer />
    </div>
  );
}
