"use client";

import { useState } from "react";
import {
  ArrowLeftRightIcon,
  CopyIcon,
  ExternalLinkIcon,
  LogOutIcon,
  TriangleAlertIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";
import { toast } from "sonner";
import type { Address, EIP1193Provider } from "viem";
import { type Connector, useAccount, useConnect, useConnectors, useDisconnect, useSwitchChain } from "wagmi";

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
  const { address, chainId, connector, isConnected, isConnecting, isReconnecting } = useAccount();
  const [open, setOpen] = useState(false);

  return (
    <>
      {isConnected && address ? (
        <AccountMenu
          address={address}
          wrongNetwork={chainId !== chain.id}
          connector={connector}
          onChangeWallet={() => setOpen(true)}
        />
      ) : (
        <Button onClick={() => setOpen(true)} disabled={isConnecting || isReconnecting}>
          <WalletIcon />
          {isConnecting || isReconnecting ? "Connecting…" : "Connect wallet"}
        </Button>
      )}
      <WalletDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

function AccountMenu({
  address,
  wrongNetwork,
  connector,
  onChangeWallet,
}: {
  address: Address;
  wrongNetwork: boolean;
  connector: Connector | undefined;
  onChangeWallet: () => void;
}) {
  const { disconnectAsync } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  const explorer = addressUrl(address);
  const walletName = connector && connector.id !== "injected" ? connector.name : "Browser wallet";

  // Opens the wallet's own account picker; wagmi follows the accountsChanged event it fires.
  async function switchAccount() {
    const provider = (await connector?.getProvider()) as EIP1193Provider | undefined;
    if (!provider || !connector) return;
    try {
      await provider.request({ method: "wallet_requestPermissions", params: [{ eth_accounts: {} }] });
      const [next] = await connector.getAccounts();
      if (next && next.toLowerCase() !== address.toLowerCase()) toast.success(`Switched to ${shortAddress(next)}`);
    } catch (e) {
      if ((e as { code?: number }).code === 4001) return; // closed the picker
      toast.info(`Pick another account in ${walletName}. Tap switches with it.`);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {wrongNetwork ? (
          <Button variant="destructive">
            <TriangleAlertIcon />
            Wrong network
          </Button>
        ) : (
          <Button variant="outline" className="font-mono">
            <span className="size-2 rounded-full bg-success" aria-hidden />
            {shortAddress(address)}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
          <span className="font-mono text-foreground">{shortAddress(address)}</span>
          <span className="text-xs text-muted-foreground">
            {walletName} · {wrongNetwork ? "wrong network" : chain.name}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {wrongNetwork && (
          <>
            <DropdownMenuItem disabled={switching} onSelect={() => switchChain({ chainId: chain.id })}>
              <ArrowLeftRightIcon /> {switching ? "Switching…" : `Switch to ${chain.name}`}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
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
        <DropdownMenuItem onSelect={switchAccount}>
          <UsersIcon /> Switch account
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={async () => {
            await disconnectAsync();
            onChangeWallet();
          }}
        >
          <WalletIcon /> Change wallet
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onSelect={() => disconnectAsync()}>
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
