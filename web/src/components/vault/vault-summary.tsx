"use client";

import { useState } from "react";
import { AlertTriangleIcon, ArrowDownToLineIcon, ArrowUpFromLineIcon } from "lucide-react";

import { FundsDialog } from "@/components/vault/funds-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatUsdc } from "@/lib/format";

export function VaultSummary({
  vaultBalance,
  walletBalance,
  approved,
  promised,
  liveCount,
}: {
  vaultBalance: bigint;
  walletBalance: bigint;
  approved: bigint;
  promised: bigint;
  liveCount: number;
}) {
  const [dialog, setDialog] = useState<"deposit" | "withdraw" | null>(null);
  const overcommitted = promised > vaultBalance;

  return (
    <Card className="gap-5 py-5">
      <div className="grid gap-5 px-5 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Vault balance</p>
          <p className="text-4xl font-semibold tracking-tight tabular-nums">
            {formatUsdc(vaultBalance)} <span className="text-lg font-normal text-muted-foreground">USDC</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Wallet: <span className="tabular-nums">{formatUsdc(walletBalance)}</span> USDC
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button onClick={() => setDialog("deposit")}>
            <ArrowDownToLineIcon /> Deposit
          </Button>
          <Button variant="outline" onClick={() => setDialog("withdraw")} disabled={vaultBalance === 0n}>
            <ArrowUpFromLineIcon /> Withdraw
          </Button>
        </div>
      </div>

      <div className="mx-5 grid grid-cols-2 gap-4 rounded-lg bg-muted/50 px-4 py-3 text-sm">
        <div>
          <p className="text-muted-foreground">Promised per period</p>
          <p className="font-medium tabular-nums">{formatUsdc(promised)} USDC</p>
        </div>
        <div>
          <p className="text-muted-foreground">Live allowances</p>
          <p className="font-medium tabular-nums">{liveCount}</p>
        </div>
      </div>

      {overcommitted && (
        <div className="mx-5 flex gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm animate-in fade-in-0">
          <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-warning" />
          <p>
            <span className="font-medium">Your allowances promise more than your vault holds.</span>{" "}
            <span className="text-muted-foreground">
              Together they can draw up to {formatUsdc(promised)} USDC per period, but the vault has{" "}
              {formatUsdc(vaultBalance)} USDC. Allowances don&apos;t reserve funds, so spends will fail once the
              vault runs short. Deposit {formatUsdc(promised - vaultBalance)} USDC to cover them all.
            </span>
          </p>
        </div>
      )}

      {dialog && (
        <FundsDialog
          mode={dialog}
          open
          onOpenChange={(open) => !open && setDialog(null)}
          walletBalance={walletBalance}
          vaultBalance={vaultBalance}
          approved={approved}
        />
      )}
    </Card>
  );
}
