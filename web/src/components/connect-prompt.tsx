"use client";

import type { ReactNode } from "react";
import { WalletIcon } from "lucide-react";
import { useAccount } from "wagmi";

import { ConnectButton } from "@/components/connect-button";
import { Loading } from "@/components/status";

/** Renders children only when a wallet is connected; otherwise explains why to connect. */
export function RequireWallet({ children, title, description }: { children: ReactNode; title: string; description: string }) {
  const { status } = useAccount();
  if (status === "reconnecting" || status === "connecting") return <Loading label="Connecting wallet…" />;
  if (status !== "connected") {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center animate-in fade-in-0">
        <div className="grid size-12 place-items-center rounded-full bg-primary/15 text-primary">
          <WalletIcon className="size-6" />
        </div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
        <ConnectButton />
      </div>
    );
  }
  return <>{children}</>;
}
