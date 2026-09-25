"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { SearchXIcon } from "lucide-react";
import { useAccount } from "wagmi";

import { Address } from "@/components/address";
import { AllowanceCard } from "@/components/allowance-card";
import { ConnectButton } from "@/components/connect-button";
import { SpenderAllowance } from "@/components/spend/spender-allowance";
import { EmptyState, ErrorNote, Loading } from "@/components/status";
import { Button } from "@/components/ui/button";
import { OwnerActions } from "@/components/vault/owner-actions";
import { useNow } from "@/hooks/use-now";
import { useAllowances } from "@/hooks/use-tap";
import { describeError } from "@/lib/errors";
import { shortAddress } from "@/lib/format";

function parseId(raw: string | string[] | undefined) {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value && /^\d+$/.test(value) && value !== "0" ? BigInt(value) : undefined;
}

export default function SharedAllowancePage() {
  const params = useParams<{ id: string }>();
  const id = parseId(params.id);
  const ids = useMemo(() => (id === undefined ? [] : [id]), [id]);
  const { allowances, vaultBalances, isLoading, error } = useAllowances(ids);
  const { address, status } = useAccount();
  const now = useNow();

  const allowance = allowances?.[0];
  if (id !== undefined && isLoading) return <Loading />;
  const message = error ? describeError(error) : undefined;
  if (message && !message.includes("doesn't exist")) return <ErrorNote>{message}</ErrorNote>;
  if (id === undefined || error || !allowance) {
    return (
      <EmptyState
        icon={<SearchXIcon className="size-5" />}
        title="Allowance not found"
        action={
          <Button asChild variant="outline">
            <Link href="/app/spend">Go to Spend</Link>
          </Button>
        }
      >
        This link doesn&apos;t point to an allowance on this network. Check that it was copied in full.
      </EmptyState>
    );
  }

  const isSpender = address?.toLowerCase() === allowance.spender.toLowerCase();
  const isOwner = address?.toLowerCase() === allowance.owner.toLowerCase();
  const vaultBalance = vaultBalances.get(allowance.owner) ?? 0n;

  return (
    <div className="mx-auto max-w-2xl space-y-6 animate-in fade-in-0">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Your USDC allowance</h1>
        <p className="flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground">
          <Address address={allowance.owner} className="text-foreground" /> lets
          <Address address={allowance.spender} className="text-foreground" /> spend from their Tap vault.
        </p>
      </div>

      {isSpender ? (
        <SpenderAllowance allowance={allowance} vaultBalance={vaultBalance} now={now} />
      ) : (
        <AllowanceCard
          allowance={allowance}
          now={now}
          counterpartyLabel="From"
          counterparty={allowance.owner}
          actions={isOwner ? <OwnerActions allowance={allowance} now={now} /> : undefined}
        />
      )}

      {status === "connected" && isOwner && !isSpender && (
        <p className="text-sm text-muted-foreground">
          This allowance is from your vault. Send this page&apos;s link to {shortAddress(allowance.spender)} so they
          can spend from it, or{" "}
          <Link href="/app" className="text-primary underline-offset-4 hover:underline">
            manage your vault
          </Link>
          .
        </p>
      )}
      {status === "connected" && !isOwner && !isSpender && (
        <p className="rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          You&apos;re connected as {shortAddress(address!)}, but this allowance is for{" "}
          {shortAddress(allowance.spender)}. Switch to that wallet to spend from it.
        </p>
      )}
      {status !== "connected" && status !== "reconnecting" && (
        <div className="flex flex-col items-start gap-3 rounded-lg border px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Connect {shortAddress(allowance.spender)} to spend from this allowance.
          </p>
          <ConnectButton />
        </div>
      )}
    </div>
  );
}
