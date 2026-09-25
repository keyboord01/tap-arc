import { parseGwei } from "viem";
import { estimateFeesPerGas } from "wagmi/actions";

import { chain } from "./config";
import { wagmiConfig } from "./wagmi";

/** Arc silently drops transactions offering less than 20 gwei. */
export const MIN_FEE_PER_GAS = parseGwei("20");
const DEFAULT_PRIORITY_FEE = parseGwei("1");

export type FeeParams = { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint };

/** EIP-1559 fees for the next transaction, never offering less than the Arc minimum. */
export async function arcFees(): Promise<FeeParams> {
  let estimate: Partial<FeeParams> = {};
  try {
    estimate = await estimateFeesPerGas(wagmiConfig, { chainId: chain.id });
  } catch {
    // Fall back to the floor below if the node can't estimate.
  }
  return withFeeFloor(estimate);
}

export function withFeeFloor(estimate: Partial<FeeParams>): FeeParams {
  const maxFeePerGas =
    estimate.maxFeePerGas && estimate.maxFeePerGas > MIN_FEE_PER_GAS ? estimate.maxFeePerGas : MIN_FEE_PER_GAS;
  const priority = estimate.maxPriorityFeePerGas ?? DEFAULT_PRIORITY_FEE;
  return { maxFeePerGas, maxPriorityFeePerGas: priority > maxFeePerGas ? maxFeePerGas : priority };
}
