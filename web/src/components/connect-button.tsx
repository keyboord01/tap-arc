"use client";

import { useState } from "react";
import { CopyIcon, ExternalLinkIcon, LogOutIcon, WalletIcon } from "lucide-react";
import { toast } from "sonner";
import { useAccount, useConnect, useConnectors, useDisconnect, useSwitchChain } from "wagmi";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { addressUrl, chain } from "@/lib/config";
import { shortAddress } from "@/lib/format";

export function ConnectButton() {
  const { address, chainId, isConnected, isConnecting, isReconnecting } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  const [open, setOpen] = useState(false);

  if (!isConnected || !address) {
    return (
      <>
        <Button onClick={() => setOpen(true)} disabled={isConnecting || isReconnecting}>
          <WalletIcon />
          {isConnecting || isReconnecting ? "Connecting…" : "Connect wallet"}
        </Button>
        <WalletDialog open={open} onOpenChange={setOpen} />
      </>
    );
  }

  if (chainId !== chain.id) {
    return (
      <Button variant="destructive" disabled={switching} onClick={() => switchChain({ chainId: chain.id })}>
        {switching ? "Switching…" : `Switch to ${chain.name}`}
      </Button>
    );
  }

  const explorer = addressUrl(address);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="font-mono">
          <span className="size-2 rounded-full bg-success" aria-hidden />
          {shortAddress(address)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal text-muted-foreground">Connected to {chain.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            navigator.clipboard.writeText(address);
            toast.success("Address copied");
          }}
        >
          <CopyIcon /> Copy address
        </DropdownMenuItem>
        {explorer && (
          <DropdownMenuItem asChild>
            <a href={explorer} target="_blank" rel="noreferrer">
              <ExternalLinkIcon /> View on explorer
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => disconnect()}>
          <LogOutIcon /> Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function WalletDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const connectors = useConnectors();
  const { connect, isPending, variables } = useConnect();

  // EIP-6963 discovery adds named wallets; hide the generic entry when a named one exists.
  const named = connectors.filter((c) => c.id !== "injected");
  const list = named.length > 0 ? named : connectors;
  const hasBrowserWallet = typeof window !== "undefined" && "ethereum" in window;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Connect a wallet</DialogTitle>
          <DialogDescription>Tap works with any browser wallet that supports {chain.name}.</DialogDescription>
        </DialogHeader>
        {named.length === 0 && !hasBrowserWallet ? (
          <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            No browser wallet found. Install a wallet such as MetaMask or Rabby, or open this page in your mobile
            wallet&apos;s built-in browser.
          </p>
        ) : (
          <div className="grid gap-2">
            {list.map((connector) => {
              const pending = isPending && variables?.connector === connector;
              return (
                <Button
                  key={connector.uid}
                  variant="outline"
                  size="lg"
                  className="justify-start"
                  disabled={isPending}
                  onClick={() =>
                    connect(
                      { connector, chainId: chain.id },
                      {
                        onSuccess: () => onOpenChange(false),
                        onError: (e) => toast.error(e.message.split("\n")[0]),
                      },
                    )
                  }
                >
                  {connector.icon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={connector.icon} alt="" className="size-5 rounded" />
                  ) : (
                    <WalletIcon />
                  )}
                  {connector.id === "injected" ? "Browser wallet" : connector.name}
                  {pending && <span className="ml-auto text-xs text-muted-foreground">Check your wallet…</span>}
                </Button>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
