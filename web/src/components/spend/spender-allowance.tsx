"use client";

import { useState } from "react";
import { SendIcon } from "lucide-react";

import { AllowanceCard } from "@/components/allowance-card";
import { SpendDialog } from "@/components/spend/spend-dialog";
import { Button } from "@/components/ui/button";
import { allowanceStatus, remainingNow, spendableNow, type Allowance } from "@/lib/allowance";
import { formatUsdc } from "@/lib/format";

/** An allowance seen by its spender, with how much can be spent right now and a Spend button. */
export function SpenderAllowance({
  allowance: a,
  vaultBalance,
  now,
}: {
  allowance: Allowance;
  vaultBalance: bigint;
  now: number;
}) {
  const [open, setOpen] = useState(false);
  const status = allowanceStatus(a, now);
  const spendable = spendableNow(a, now, vaultBalance);
  const vaultShort = status === "active" && vaultBalance < remainingNow(a, now);

  const note = vaultShort ? `The owner's vault only holds ${formatUsdc(vaultBalance)} USDC` : null;

  return (
    <>
      <AllowanceCard
        allowance={a}
        now={now}
        counterpartyLabel="From"
        counterparty={a.owner}
        footer={
          status === "active" ? (
            <div className="flex w-full flex-wrap items-center justify-between gap-3 sm:w-auto sm:justify-end">
              {note && <span className="text-sm text-warning">{note}</span>}
              <Button size="sm" onClick={() => setOpen(true)} disabled={spendable === 0n}>
                <SendIcon /> Spend
              </Button>
            </div>
          ) : undefined
        }
      />
      {open && <SpendDialog allowance={a} vaultBalance={vaultBalance} now={now} open onOpenChange={setOpen} />}
    </>
  );
}
