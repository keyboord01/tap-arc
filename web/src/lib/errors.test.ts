import {
  ContractFunctionExecutionError,
  ContractFunctionRevertedError,
  UserRejectedRequestError,
  encodeErrorResult,
} from "viem";
import { describe, expect, it } from "vitest";

import { describeError, tokenErrorsAbi } from "./errors";
import { tapAbi } from "./tap-abi";

const abi = [...tapAbi, ...tokenErrorsAbi];
const ZERO = "0x0000000000000000000000000000000000000000";

function revert(errorName: string, args: readonly unknown[] = []) {
  const data = encodeErrorResult({ abi, errorName, args } as Parameters<typeof encodeErrorResult>[0]);
  const cause = new ContractFunctionRevertedError({ abi, data, functionName: "spend" });
  return new ContractFunctionExecutionError(cause, { abi, functionName: "spend", args: [1n, ZERO, 1n] });
}

function revertWithReason(reason: string) {
  const cause = new ContractFunctionRevertedError({ abi, functionName: "spend", message: reason });
  return new ContractFunctionExecutionError(cause, { abi, functionName: "spend", args: [1n, ZERO, 1n] });
}

describe("describeError", () => {
  it("explains an exhausted limit", () => {
    expect(describeError(revert("LimitExceeded", [1n, 0n, 5_000_000n]))).toMatch(/used up/);
  });

  it("includes what is left when the limit is partly used", () => {
    expect(describeError(revert("LimitExceeded", [1n, 2_500_000n, 5_000_000n]))).toMatch(/2\.50 USDC/);
  });

  it("explains a short vault with amounts", () => {
    const msg = describeError(revert("InsufficientVaultBalance", [1_000_000n, 3_000_000n]));
    expect(msg).toMatch(/1\.00 USDC/);
    expect(msg).toMatch(/3\.00 USDC/);
  });

  it.each([
    ["Paused", [1n], /paused/],
    ["Revoked", [1n], /revoked/],
    ["Expired", [1n, 1_767_225_600n], /expired on Jan 1, 2026/],
    ["NotSpender", [1n, "0x0000000000000000000000000000000000000001"], /spender/],
    ["NotOwner", [1n, "0x0000000000000000000000000000000000000001"], /owner/],
    ["Blocklisted", ["0x0000000000000000000000000000000000000001"], /blocklist/],
  ] as const)("decodes %s", (name, args, pattern) => {
    expect(describeError(revert(name, args))).toMatch(pattern);
  });

  it("recognises blocklist revert strings from USDC", () => {
    expect(describeError(revertWithReason("Blacklistable: account is blacklisted"))).toMatch(/blocklist/);
  });

  it("recognises a rejected wallet request", () => {
    const error = new UserRejectedRequestError(new Error("User rejected the request."));
    expect(describeError(error)).toMatch(/cancelled/);
  });
});
