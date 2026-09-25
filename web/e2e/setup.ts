import { encodeFunctionData, erc20Abi, parseAbi } from "viem";

import { tapAbi } from "../src/lib/tap-abi";
import { ACCOUNTS, TAP, USDC, sendAs } from "./wallet";

const mockAbi = parseAbi(["function setBlocked(address account, bool isBlocked)"]);

/** Owner deposits `deposit` USDC and gives the spender `limit` USDC every `days` days. */
export async function seedAllowance({ deposit = 100_000_000n, limit = 20_000_000n, days = 7 } = {}) {
  await sendAs(ACCOUNTS.owner, USDC, encodeFunctionData({ abi: erc20Abi, functionName: "approve", args: [TAP, deposit] }));
  await sendAs(ACCOUNTS.owner, TAP, encodeFunctionData({ abi: tapAbi, functionName: "deposit", args: [deposit] }));
  await sendAs(
    ACCOUNTS.owner,
    TAP,
    encodeFunctionData({
      abi: tapAbi,
      functionName: "createAllowance",
      args: [ACCOUNTS.spender, limit, BigInt(days * 86_400), 0n, 0n],
    }),
  );
}

export async function setBlocked(account: `0x${string}`, blocked = true) {
  await sendAs(ACCOUNTS.owner, USDC, encodeFunctionData({ abi: mockAbi, functionName: "setBlocked", args: [account, blocked] }));
}

export async function pauseAllowance(id: bigint) {
  await sendAs(ACCOUNTS.owner, TAP, encodeFunctionData({ abi: tapAbi, functionName: "pause", args: [id] }));
}

export async function allowanceCount() {
  const { rpc } = await import("./wallet");
  const data = encodeFunctionData({ abi: tapAbi, functionName: "allowanceCount" });
  return BigInt(await rpc<string>("eth_call", [{ to: TAP, data }, "latest"]));
}
