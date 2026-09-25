import type { Address } from "viem";

/** An allowance as returned by `Tap.getAllowance`, plus its id. */
export type Allowance = {
  id: bigint;
  owner: Address;
  spender: Address;
  amountPerPeriod: bigint;
  periodLength: bigint;
  start: bigint;
  expiry: bigint;
  paused: boolean;
  revoked: boolean;
  spentThisPeriod: bigint;
  periodIndex: bigint;
};

export type AllowanceStatus = "active" | "paused" | "scheduled" | "expired" | "revoked";

export const statusLabel: Record<AllowanceStatus, string> = {
  active: "Active",
  paused: "Paused",
  scheduled: "Not started",
  expired: "Expired",
  revoked: "Revoked",
};

// The helpers below mirror Tap.sol exactly, so the UI can update at a period
// boundary without waiting for a new read. `now` is a unix time in seconds.

export function allowanceStatus(a: Allowance, now: number): AllowanceStatus {
  if (a.revoked) return "revoked";
  if (a.expiry !== 0n && BigInt(now) >= a.expiry) return "expired";
  if (a.paused) return "paused";
  if (BigInt(now) < a.start) return "scheduled";
  return "active";
}

export function currentPeriod(a: Allowance, now: number) {
  const t = BigInt(now);
  const index = t < a.start ? 0n : (t - a.start) / a.periodLength;
  const start = a.start + index * a.periodLength;
  return { index, start: Number(start), end: Number(start + a.periodLength) };
}

/** Spent so far in the current period: the stored amount only counts for its own period. */
export function spentNow(a: Allowance, now: number) {
  return currentPeriod(a, now).index === a.periodIndex ? a.spentThisPeriod : 0n;
}

/** Left of this period's limit. Saturates at 0 if the limit was lowered below what was spent. */
export function remainingNow(a: Allowance, now: number) {
  const spent = spentNow(a, now);
  return a.amountPerPeriod > spent ? a.amountPerPeriod - spent : 0n;
}

/** What the spender could actually spend right now, given the owner's vault balance. */
export function spendableNow(a: Allowance, now: number, vaultBalance: bigint) {
  if (allowanceStatus(a, now) !== "active") return 0n;
  const left = remainingNow(a, now);
  return left < vaultBalance ? left : vaultBalance;
}

/** The last day an allowance can be used, for "until Dec 31" labels. Expiry is exclusive. */
export function lastUsableSecond(a: Allowance) {
  return a.expiry === 0n ? undefined : Number(a.expiry) - 1;
}

/** Whether the allowance still counts toward what the owner has promised. */
export function isLive(a: Allowance, now: number) {
  const status = allowanceStatus(a, now);
  return status === "active" || status === "scheduled";
}
