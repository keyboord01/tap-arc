"use client";

import { useState } from "react";
import { erc20Abi, type Address } from "viem";

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
import { Label } from "@/components/ui/label";
import { txStep, useTx, type TxStep } from "@/hooks/use-tx";
import { tapAddress, usdcAddress } from "@/lib/config";
import { formatUsdc, parseUsdc } from "@/lib/format";
import { tapAbi } from "@/lib/tap-abi";

type Mode = "deposit" | "withdraw";

export function FundsDialog({
  mode,
  open,
  onOpenChange,
  walletBalance,
  vaultBalance,
  approved,
}: {
  mode: Mode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletBalance: bigint;
  vaultBalance: bigint;
  approved: bigint;
}) {
  const [value, setValue] = useState("");
  const { run, busy } = useTx();
  const amount = parseUsdc(value);
  const max = mode === "deposit" ? walletBalance : vaultBalance;
  const tooMuch = amount !== undefined && amount > max;
  const needsApproval = mode === "deposit" && amount !== undefined && amount > approved;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || tooMuch) return;
    const label = `${formatUsdc(amount)} USDC`;
    const steps: TxStep[] = [];
    if (needsApproval) {
      // Approve exactly the amount being deposited, never an unlimited approval.
      steps.push(
        txStep(`Approve ${label}`, {
          address: usdcAddress,
          abi: erc20Abi,
          functionName: "approve",
          args: [tapAddress as Address, amount],
        }),
      );
    }
    steps.push(
      mode === "deposit"
        ? txStep(`Deposit ${label}`, { address: tapAddress as Address, abi: tapAbi, functionName: "deposit", args: [amount] })
        : txStep(`Withdraw ${label}`, {
            address: tapAddress as Address,
            abi: tapAbi,
            functionName: "withdraw",
            args: [amount],
          }),
    );
    if (await run(steps)) {
      setValue("");
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="grid gap-5">
          <DialogHeader>
            <DialogTitle>{mode === "deposit" ? "Deposit to vault" : "Withdraw from vault"}</DialogTitle>
            <DialogDescription>
              {mode === "deposit"
                ? "Move USDC from your wallet into your vault. Your allowances spend from the vault."
                : "Move USDC from your vault back to your wallet. You can withdraw everything at any time."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor={`${mode}-amount`}>Amount</Label>
            <AmountInput id={`${mode}-amount`} autoFocus value={value} onValueChange={setValue} max={max} />
            <p className={tooMuch ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
              {mode === "deposit" ? "Wallet" : "Vault"} balance: {formatUsdc(max)} USDC
            </p>
          </div>
          {needsApproval && !tooMuch && (
            <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
              Your wallet will ask for two confirmations: approving this amount, then the deposit.
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!amount || tooMuch || busy}>
              {busy ? "Working…" : mode === "deposit" ? "Deposit" : "Withdraw"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
