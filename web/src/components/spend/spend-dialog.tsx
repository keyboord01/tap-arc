"use client";

import { useState } from "react";
import { getAddress, isAddress, type Address } from "viem";
import { useAccount } from "wagmi";

import { AmountInput } from "@/components/amount-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { txStep, useTx } from "@/hooks/use-tx";
import { remainingNow, type Allowance } from "@/lib/allowance";
import { tapAddress } from "@/lib/config";
import { formatUsdc, parseUsdc, shortAddress } from "@/lib/format";
import { tapAbi } from "@/lib/tap-abi";

export function SpendDialog({
  allowance: a,
  vaultBalance,
  now,
  open,
  onOpenChange,
}: {
  allowance: Allowance;
  vaultBalance: bigint;
  now: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { address } = useAccount();
  const { run, busy } = useTx();
  const [recipient, setRecipient] = useState("");
  const [value, setValue] = useState("");

  const amount = parseUsdc(value);
  const remaining = remainingNow(a, now);
  const spendable = remaining < vaultBalance ? remaining : vaultBalance;
  const recipientValid = isAddress(recipient.trim());

  let problem: string | undefined;
  if (amount !== undefined && amount > remaining) {
    problem = `Only ${formatUsdc(remaining)} USDC is left this period.`;
  } else if (amount !== undefined && amount > vaultBalance) {
    problem = `The owner's vault only holds ${formatUsdc(vaultBalance)} USDC right now.`;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || !recipientValid || problem) return;
    const to = getAddress(recipient.trim());
    const ok = await run([
      txStep(`Send ${formatUsdc(amount)} USDC to ${shortAddress(to)}`, {
        address: tapAddress as Address,
        abi: tapAbi,
        functionName: "spend",
        args: [a.id, to, amount],
      }),
    ]);
    if (ok) {
      setValue("");
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="grid gap-5">
          <DialogHeader>
            <DialogTitle>Spend from allowance</DialogTitle>
            <DialogDescription>
              Send USDC from {shortAddress(a.owner)}&apos;s vault to any address. You can spend up to{" "}
              {formatUsdc(spendable)} USDC right now.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="recipient">Recipient</Label>
              {address && (
                <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={() => setRecipient(address)}>
                  Send to my wallet
                </Button>
              )}
            </div>
            <Input
              id="recipient"
              autoFocus
              placeholder="0x…"
              spellCheck={false}
              autoComplete="off"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              aria-invalid={recipient !== "" && !recipientValid}
              className="font-mono"
            />
            {recipient !== "" && !recipientValid && <p className="text-sm text-destructive">Enter a valid address.</p>}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="spend-amount">Amount</Label>
            <AmountInput id="spend-amount" value={value} onValueChange={setValue} max={spendable} />
            {problem && <p className="text-sm text-destructive">{problem}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!amount || !recipientValid || !!problem || busy}>
              {busy ? "Sending…" : "Send"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
