import { headers } from "next/headers";
import { cookieToInitialState } from "wagmi";

import { NotConfigured } from "@/components/not-configured";
import { Providers } from "@/components/providers";
import { MobileNav, SiteHeader } from "@/components/site-header";
import { chain, tapAddress } from "@/lib/config";
import { wagmiConfig } from "@/lib/wagmi";

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  const initialState = cookieToInitialState(wagmiConfig, (await headers()).get("cookie"));
  return (
    <Providers initialState={initialState}>
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-24 md:pb-12">
        {tapAddress ? children : <NotConfigured />}
      </main>
      <footer className="hidden border-t py-6 text-center text-xs text-muted-foreground md:block">
        Tap on {chain.name}
        {tapAddress && (
          <>
            {" · "}
            <span className="font-mono">{tapAddress}</span>
          </>
        )}
      </footer>
      <MobileNav />
    </Providers>
  );
}
