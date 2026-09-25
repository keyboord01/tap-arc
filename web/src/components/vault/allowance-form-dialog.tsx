"use client";

import { useState } from "react";
import { isAddress, getAddress, type Address } from "viem";
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
import { lastUsableSecond, spentNow, type Allowance } from "@/lib/allowance";
import { tapAddress } from "@/lib/config";
import { formatUsdc, parseUsdc, periodLabel } from "@/lib/format";
import { tapAbi } from "@/lib/tap-abi";

const DAY = 86_400;
const PRESETS = [7, 30] as const;

/** "YYYY-MM-DD" (local) -> expiry timestamp: the start of the following day, so the chosen day is usable. */
function dateToExpiry(date: string): number | undefined {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return Math.floor(new Date(y, m - 1, d + 1).getTime() / 1000);
}

function expiryToDate(a: Allowance): string {
  const last = lastUsableSecond(a);
  if (last === undefined) return "";
  const dt = new Date(last * 1000);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

function todayString() {
  const dt = new Date();
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

/** Create a new allowance, or edit one when `allowance` is given. */
export function AllowanceFormDialog({
  open,
  onOpenChange,
  allowance,
  now,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allowance?: Allowance;
  now: number;
}) {
  const editing = !!allowance;
  const initialDays = allowance ? Number(allowance.periodLength) / DAY : 7;
  const { address: account } = useAccount();
  const { run, busy } = useTx();

  const [spender, setSpender] = useState("");
  const [amount, setAmount] = useState(allowance ? String(Number(allowance.amountPerPeriod) / 1e6) : "");
  const [preset, setPreset] = useState<number | "custom">(
    PRESETS.includes(initialDays as 7 | 30) ? initialDays : "custom",
  );
  const [customDays, setCustomDays] = useState(Number.isInteger(initialDays) ? String(initialDays) : "");
  const [hasEnd, setHasEnd] = useState(!!allowance && allowance.expiry !== 0n);
  const [endDate, setEndDate] = useState(allowance ? expiryToDate(allowance) : "");

  const parsedAmount = parseUsdc(amount);
  const days = preset === "custom" ? Number(customDays) : preset;
  const validDays = Number.isInteger(days) && days >= 1 && days <= 3650;
  const periodLength = validDays ? BigInt(days * DAY) : undefined;
  const expiry = hasEnd ? dateToExpiry(endDate) : 0;
  const validExpiry = !hasEnd || (expiry !== undefined && expiry > now);
  const spenderValid = editing || isAddress(spender.trim());
  const selfSpender = !editing && spenderValid && account && getAddress(spender.trim()) === account;

  const periodChanged = editing && periodLength !== undefined && periodLength !== allowance.periodLength;
  const spent = allowance ? spentNow(allowance, now) : 0n;
  const belowSpent = editing && !periodChanged && parsedAmount !== undefined && parsedAmount < spent;

  const canSubmit =
    spenderValid && !selfSpender && !!parsedAmount && parsedAmount > 0n && !!periodLength && validExpiry && !busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !parsedAmount || !periodLength || expiry === undefined) return;
    const rule = `${formatUsdc(parsedAmount)} USDC ${periodLabel(Number(periodLength))}`;
    const step = editing
      ? txStep(`Update allowance to ${rule}`, {
          address: tapAddress as Address,
          abi: tapAbi,
          functionName: "editAllowance",
          args: [allowance.id, parsedAmount, periodLength, BigInt(expiry)],
        })
      : txStep(`Create allowance: ${rule}`, {
          address: tapAddress as Address,
          abi: tapAbi,
          functionName: "createAllowance",
          args: [getAddress(spender.trim()), parsedAmount, periodLength, 0n, BigInt(expiry)],
        });
    if (await run([step])) onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="grid gap-5">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit allowance" : "New allowance"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Change the limit, period or end date. The spender stays the same."
                : "Let someone spend from your vault, up to a limit that resets every period."}
            </DialogDescription>
          </DialogHeader>

          {!editing && (
            <div className="grid gap-2">
              <Label htmlFor="spender">Spender address</Label>
              <Input
                id="spender"
                autoFocus
                placeholder="0x…"
                spellCheck={false}
                autoComplete="off"
                value={spender}
                onChange={(e) => setSpender(e.target.value)}
                aria-invalid={spender !== "" && !spenderValid}
                className="font-mono"
              />
              {spender !== "" && !spenderValid && <p className="text-sm text-destructive">Enter a valid address.</p>}
              {selfSpender && (
                <p className="text-sm text-destructive">That&apos;s your own address. Withdraw from your vault instead.</p>
              )}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="limit">Limit per period</Label>
            <AmountInput id="limit" value={amount} onValueChange={setAmount} autoFocus={editing} />
            {belowSpent && (
              <p className="text-sm text-muted-foreground">
                {formatUsdc(spent)} USDC was already spent this period, so nothing more can be spent until the period
                resets.
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Resets</Label>
            <div className="grid grid-cols-3 gap-2" role="radiogroup">
              {PRESETS.map((d) => (
                <Button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={preset === d}
                  variant={preset === d ? "default" : "outline"}
                  onClick={() => setPreset(d)}
                >
                  Every {d} days
                </Button>
              ))}
              <Button
                type="button"
                role="radio"
                aria-checked={preset === "custom"}
                variant={preset === "custom" ? "default" : "outline"}
                onClick={() => setPreset("custom")}
              >
                Custom
              </Button>
            </div>
            {preset === "custom" && (
              <div className="flex items-center gap-2 animate-in fade-in-0">
                <span className="text-sm text-muted-foreground">Every</span>
                <Input
                  type="number"
                  min={1}
                  max={3650}
                  inputMode="numeric"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  className="w-24"
                  aria-label="Days per period"
                />
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            )}
            {periodChanged && (
              <p className="text-sm text-muted-foreground">
                Changing the period starts a fresh period now, with the full limit available.
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <label className="flex items-center gap-2 text-sm font-medium" htmlFor="has-end">
              <input
                id="has-end"
                type="checkbox"
                checked={hasEnd}
                onChange={(e) => setHasEnd(e.target.checked)}
                className="size-4 cursor-pointer accent-[var(--primary)]"
              />
              Set an end date
            </label>
            {hasEnd && (
              <div className="grid gap-1 animate-in fade-in-0">
                <Input
                  type="date"
                  min={todayString()}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  aria-label="Last day the allowance can be used"
                  aria-invalid={endDate !== "" && !validExpiry}
                />
                <p className="text-sm text-muted-foreground">The allowance can be used through the end of this day.</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {busy ? "Working…" : editing ? "Save changes" : "Create allowance"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
