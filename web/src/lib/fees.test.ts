import { parseGwei } from "viem";
import { describe, expect, it } from "vitest";

import { MIN_FEE_PER_GAS, withFeeFloor } from "./fees";

describe("withFeeFloor", () => {
  it("raises low estimates to the 20 gwei minimum", () => {
    const fees = withFeeFloor({ maxFeePerGas: parseGwei("1"), maxPriorityFeePerGas: parseGwei("0.5") });
    expect(fees.maxFeePerGas).toBe(MIN_FEE_PER_GAS);
    expect(fees.maxPriorityFeePerGas).toBe(parseGwei("0.5"));
  });

  it("keeps estimates above the minimum", () => {
    const fees = withFeeFloor({ maxFeePerGas: parseGwei("45"), maxPriorityFeePerGas: parseGwei("2") });
    expect(fees.maxFeePerGas).toBe(parseGwei("45"));
  });

  it("uses the minimum when estimation fails", () => {
    const fees = withFeeFloor({});
    expect(fees.maxFeePerGas).toBe(parseGwei("20"));
    expect(fees.maxPriorityFeePerGas).toBeLessThanOrEqual(fees.maxFeePerGas);
  });

  it("never lets the priority fee exceed the max fee", () => {
    const fees = withFeeFloor({ maxFeePerGas: parseGwei("10"), maxPriorityFeePerGas: parseGwei("30") });
    expect(fees.maxPriorityFeePerGas).toBe(fees.maxFeePerGas);
  });
});
