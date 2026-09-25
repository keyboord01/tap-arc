import { describe, expect, it } from "vitest";

import {
  allowanceStatus,
  currentPeriod,
  remainingNow,
  spendableNow,
  spentNow,
  type Allowance,
} from "./allowance";

const T0 = 1_767_225_600;
const WEEK = 7 * 86_400;
const USDC = 1_000_000n;

function allowance(overrides: Partial<Allowance> = {}): Allowance {
  return {
    id: 1n,
    owner: "0x0000000000000000000000000000000000000001",
    spender: "0x0000000000000000000000000000000000000002",
    amountPerPeriod: 20n * USDC,
    periodLength: BigInt(WEEK),
    start: BigInt(T0),
    expiry: 0n,
    paused: false,
    revoked: false,
    spentThisPeriod: 0n,
    periodIndex: 0n,
    ...overrides,
  };
}

describe("currentPeriod", () => {
  it("uses fixed windows counted from start", () => {
    const a = allowance();
    expect(currentPeriod(a, T0)).toEqual({ index: 0n, start: T0, end: T0 + WEEK });
    expect(currentPeriod(a, T0 + WEEK - 1).index).toBe(0n);
    expect(currentPeriod(a, T0 + WEEK).index).toBe(1n);
    expect(currentPeriod(a, T0 + 10 * WEEK + 5)).toEqual({ index: 10n, start: T0 + 10 * WEEK, end: T0 + 11 * WEEK });
  });

  it("describes period 0 before start", () => {
    expect(currentPeriod(allowance(), T0 - 100)).toEqual({ index: 0n, start: T0, end: T0 + WEEK });
  });
});

describe("remainingNow", () => {
  it("subtracts what was spent in the current period", () => {
    const a = allowance({ spentThisPeriod: 15n * USDC });
    expect(remainingNow(a, T0 + 1)).toBe(5n * USDC);
  });

  it("resets exactly at the boundary", () => {
    const a = allowance({ spentThisPeriod: 20n * USDC });
    expect(remainingNow(a, T0 + WEEK - 1)).toBe(0n);
    expect(remainingNow(a, T0 + WEEK)).toBe(20n * USDC);
    expect(spentNow(a, T0 + WEEK)).toBe(0n);
  });

  it("never underflows when the limit was lowered below what was spent", () => {
    const a = allowance({ amountPerPeriod: 10n * USDC, spentThisPeriod: 15n * USDC });
    expect(remainingNow(a, T0 + 1)).toBe(0n);
  });
});

describe("allowanceStatus", () => {
  it("orders revoked > expired > paused > scheduled > active", () => {
    expect(allowanceStatus(allowance({ revoked: true, paused: true }), T0)).toBe("revoked");
    expect(allowanceStatus(allowance({ expiry: BigInt(T0 + 10), paused: true }), T0 + 10)).toBe("expired");
    expect(allowanceStatus(allowance({ expiry: BigInt(T0 + 10) }), T0 + 9)).toBe("active");
    expect(allowanceStatus(allowance({ paused: true }), T0)).toBe("paused");
    expect(allowanceStatus(allowance(), T0 - 1)).toBe("scheduled");
    expect(allowanceStatus(allowance(), T0)).toBe("active");
  });
});

describe("spendableNow", () => {
  it("is capped by the vault balance", () => {
    expect(spendableNow(allowance(), T0, 7n * USDC)).toBe(7n * USDC);
    expect(spendableNow(allowance(), T0, 100n * USDC)).toBe(20n * USDC);
  });

  it("is zero unless active", () => {
    expect(spendableNow(allowance({ paused: true }), T0, 100n * USDC)).toBe(0n);
    expect(spendableNow(allowance(), T0 - 1, 100n * USDC)).toBe(0n);
  });
});
