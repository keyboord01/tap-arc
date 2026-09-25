import { describe, expect, it } from "vitest";

import { formatDuration, formatUsdc, parseUsdc, periodLabel } from "./format";

describe("formatUsdc", () => {
  it("formats whole and fractional amounts", () => {
    expect(formatUsdc(20_000_000n)).toBe("20.00");
    expect(formatUsdc(12_345_678n)).toBe("12.34");
    expect(formatUsdc(1_234_567_000_000n)).toBe("1,234,567.00");
  });

  it("does not hide tiny non-zero amounts", () => {
    expect(formatUsdc(1n)).toBe("0.000001");
    expect(formatUsdc(0n)).toBe("0.00");
  });
});

describe("parseUsdc", () => {
  it("parses up to 6 decimals", () => {
    expect(parseUsdc("20")).toBe(20_000_000n);
    expect(parseUsdc("0.000001")).toBe(1n);
    expect(parseUsdc("1,000.5")).toBe(1_000_500_000n);
  });

  it("rejects invalid or over-precise input", () => {
    expect(parseUsdc("")).toBeUndefined();
    expect(parseUsdc("abc")).toBeUndefined();
    expect(parseUsdc("1.0000001")).toBeUndefined();
    expect(parseUsdc("-1")).toBeUndefined();
  });
});

describe("periodLabel", () => {
  it("says 'every N days', never weekly or monthly", () => {
    expect(periodLabel(7 * 86_400)).toBe("every 7 days");
    expect(periodLabel(30 * 86_400)).toBe("every 30 days");
    expect(periodLabel(86_400)).toBe("every day");
    expect(periodLabel(3600 * 12)).toBe("every 12 hours");
  });
});

describe("formatDuration", () => {
  it("formats compact countdowns", () => {
    expect(formatDuration(3 * 86_400 + 4 * 3600 + 59)).toBe("3d 4h");
    expect(formatDuration(5 * 3600 + 12 * 60)).toBe("5h 12m");
    expect(formatDuration(42)).toBe("42s");
    expect(formatDuration(-5)).toBe("0s");
  });
});
