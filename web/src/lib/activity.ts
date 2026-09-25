import type { Address, Hash } from "viem";

import { formatUsdc, periodLabel, shortAddress } from "./format";

/** Arc RPC limits: at most ~5,000 blocks and 2,000 results per log query. */
export const MAX_BLOCK_RANGE = 5_000n;

export type ActivityEvent = {
  key: string;
  name:
    | "Deposited"
    | "Withdrawn"
    | "AllowanceCreated"
    | "AllowanceEdited"
    | "AllowancePaused"
    | "AllowanceUnpaused"
    | "AllowanceRevoked"
    | "Spent";
  args: Record<string, unknown>;
  blockNumber: bigint;
  logIndex: number;
  transactionHash: Hash;
};

/** Block ranges walking backwards from `to` down to `floor`, newest first. */
export function backwardRanges(to: bigint, floor: bigint, count: number, size = MAX_BLOCK_RANGE) {
  const ranges: { from: bigint; to: bigint }[] = [];
  let end = to;
  while (ranges.length < count && end >= floor) {
    const start = end - size + 1n > floor ? end - size + 1n : floor;
    ranges.push({ from: start, to: end });
    if (start === floor) break;
    end = start - 1n;
  }
  return ranges;
}

/** Block ranges walking forwards from `from` to `to`, oldest first. */
export function forwardRanges(from: bigint, to: bigint, size = MAX_BLOCK_RANGE) {
  const ranges: { from: bigint; to: bigint }[] = [];
  for (let start = from; start <= to; start += size) {
    ranges.push({ from: start, to: start + size - 1n < to ? start + size - 1n : to });
  }
  return ranges;
}

/** Newest first; stable across chunks. */
export function sortEvents(events: ActivityEvent[]) {
  return [...events].sort((a, b) =>
    a.blockNumber === b.blockNumber ? b.logIndex - a.logIndex : a.blockNumber > b.blockNumber ? -1 : 1,
  );
}

const same = (a: unknown, b: string | undefined) => !!b && typeof a === "string" && a.toLowerCase() === b.toLowerCase();

/** Whether an event concerns `account`, directly or through one of its allowances. */
export function isRelevant(e: ActivityEvent, account: Address | undefined, ids: Set<string>) {
  if (!account) return true;
  if (same(e.args.owner, account) || same(e.args.spender, account) || same(e.args.to, account)) return true;
  return e.args.id !== undefined && ids.has(String(e.args.id));
}

/** One line of plain English for an event, from the viewer's point of view. */
export function describeEvent(e: ActivityEvent, viewer?: Address): string {
  const a = e.args;
  const who = (addr: unknown) => (same(addr, viewer) ? "You" : shortAddress(String(addr)));
  const whom = (addr: unknown) => (same(addr, viewer) ? "you" : shortAddress(String(addr)));
  const usdc = (v: unknown) => `${formatUsdc(v as bigint)} USDC`;
  const id = `#${String(a.id)}`;

  switch (e.name) {
    case "Deposited":
      return `${who(a.owner)} deposited ${usdc(a.amount)}`;
    case "Withdrawn":
      return `${who(a.owner)} withdrew ${usdc(a.amount)}`;
    case "AllowanceCreated":
      return `${who(a.owner)} gave ${whom(a.spender)} ${usdc(a.amountPerPeriod)} ${periodLabel(Number(a.periodLength))} (allowance ${id})`;
    case "AllowanceEdited":
      return `Allowance ${id} changed to ${usdc(a.amountPerPeriod)} ${periodLabel(Number(a.periodLength))}`;
    case "AllowancePaused":
      return `Allowance ${id} paused`;
    case "AllowanceUnpaused":
      return `Allowance ${id} resumed`;
    case "AllowanceRevoked":
      return `Allowance ${id} revoked`;
    case "Spent":
      return `${who(a.spender)} sent ${usdc(a.amount)} to ${whom(a.to)} from allowance ${id}`;
  }
}

/** "just now", "5m ago", "3h ago", "2d ago", or a date for anything older than a week. */
export function timeAgo(seconds: number, now: number) {
  const d = Math.max(0, now - seconds);
  if (d < 10) return "just now";
  if (d < 60) return `${d}s ago`;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86_400) return `${Math.floor(d / 3600)}h ago`;
  if (d < 7 * 86_400) return `${Math.floor(d / 86_400)}d ago`;
  return new Date(seconds * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
