import { formatUnits, parseUnits } from "viem";

export const USDC_DECIMALS = 6;

/** Format a 6-decimal USDC amount, e.g. 12_500_000n -> "12.50". */
export function formatUsdc(value: bigint, { maxDecimals = 2 }: { maxDecimals?: number } = {}) {
  const [whole, fraction = ""] = formatUnits(value, USDC_DECIMALS).split(".");
  const trimmed = fraction.slice(0, Math.max(maxDecimals, 2)).padEnd(2, "0");
  // Show more precision only when it would otherwise hide a non-zero amount.
  const precise = fraction.replace(/0+$/, "");
  const decimals = precise.length > trimmed.length && whole === "0" ? precise : trimmed;
  return `${BigInt(whole).toLocaleString("en-US")}.${decimals}`;
}

/** Parse user input into 6-decimal units. Returns undefined for anything invalid or too precise. */
export function parseUsdc(input: string): bigint | undefined {
  const value = input.trim().replace(/,/g, "");
  if (!/^\d*(\.\d{0,6})?$/.test(value) || value === "" || value === ".") return undefined;
  try {
    return parseUnits(value, USDC_DECIMALS);
  } catch {
    return undefined;
  }
}

export function shortAddress(address: string) {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

const DAY = 86_400;

/** "every 7 days", "every 30 days", "every day", "every 12 hours"; never "weekly/monthly". */
export function periodLabel(seconds: number) {
  if (seconds % DAY === 0) {
    const days = seconds / DAY;
    return days === 1 ? "every day" : `every ${days} days`;
  }
  if (seconds % 3600 === 0) {
    const hours = seconds / 3600;
    return hours === 1 ? "every hour" : `every ${hours} hours`;
  }
  if (seconds % 60 === 0) return `every ${seconds / 60} minutes`;
  return `every ${seconds} seconds`;
}

/** Compact countdown such as "3d 4h", "5h 12m", "42s". */
export function formatDuration(totalSeconds: number) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const d = Math.floor(s / DAY);
  const h = Math.floor((s % DAY) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return h > 0 ? `${d}d ${h}h` : `${d}d`;
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  if (m > 0) return `${m}m`;
  return `${s % 60}s`;
}

export function formatDate(seconds: number) {
  return new Date(seconds * 1000).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
