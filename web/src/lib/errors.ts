import {
  BaseError,
  ContractFunctionRevertedError,
  InsufficientFundsError,
  UserRejectedRequestError,
  parseAbi,
} from "viem";

import { formatDate, formatUsdc } from "./format";

/** Errors that USDC (or the local mock) can raise, so reverts decode even when they come from the token. */
export const tokenErrorsAbi = parseAbi([
  "error ERC20InsufficientBalance(address sender, uint256 balance, uint256 needed)",
  "error ERC20InsufficientAllowance(address spender, uint256 allowance, uint256 needed)",
  "error Blocklisted(address account)",
]);

const BLOCKLIST_MESSAGE =
  "USDC can't move to or from this address: it's on Circle's blocklist. Try a different recipient.";

type Args = readonly unknown[];

const messages: Record<string, (args: Args) => string> = {
  ZeroAmount: () => "Enter an amount greater than zero.",
  ZeroAddress: () => "Enter a valid address.",
  ZeroPeriod: () => "The period must be longer than zero.",
  InvalidExpiry: () => "The end date must be in the future (and after the start date).",
  InvalidToken: () => "The contract is configured with the wrong token.",
  InsufficientVaultBalance: ([available, requested]) =>
    `The vault only holds ${formatUsdc(available as bigint)} USDC, not enough for ${formatUsdc(requested as bigint)} USDC.`,
  AllowanceNotFound: () => "This allowance doesn't exist.",
  NotOwner: () => "Only the vault owner can change this allowance.",
  NotSpender: () => "Only this allowance's spender can spend from it. Switch to the spender's wallet.",
  NotStarted: ([, start]) => `This allowance hasn't started yet. It starts on ${formatDate(Number(start))}.`,
  Expired: ([, expiry]) => `This allowance expired on ${formatDate(Number(expiry))}.`,
  Paused: () => "This allowance is paused by its owner.",
  NotPaused: () => "This allowance isn't paused.",
  Revoked: () => "This allowance was revoked by its owner.",
  LimitExceeded: ([, remaining]) =>
    (remaining as bigint) === 0n
      ? "The limit for this period is used up. It resets when the next period starts."
      : `Limit reached: only ${formatUsdc(remaining as bigint)} USDC is left this period.`,
  ReentrancyGuardReentrantCall: () => "The transaction was rejected by the contract's safety check.",
  SafeERC20FailedOperation: () => "The USDC transfer failed.",
  ERC20InsufficientBalance: () => "Your wallet doesn't have enough USDC.",
  ERC20InsufficientAllowance: () => "Tap isn't approved to move that much of your USDC yet.",
  Blocklisted: () => BLOCKLIST_MESSAGE,
};

/** Turn any wallet, RPC or contract error into one plain sentence. */
export function describeError(error: unknown): string {
  if (!(error instanceof BaseError)) {
    return error instanceof Error ? error.message.split("\n")[0] : "Something went wrong.";
  }

  if (error.walk((e) => e instanceof UserRejectedRequestError)) return "You cancelled the request in your wallet.";
  if (error.walk((e) => e instanceof InsufficientFundsError))
    return "Your wallet doesn't have enough USDC to pay the network fee.";

  const revert = error.walk((e) => e instanceof ContractFunctionRevertedError);
  if (revert instanceof ContractFunctionRevertedError) {
    const name = revert.data?.errorName;
    if (name && messages[name]) return messages[name](revert.data?.args ?? []);
    const reason = revert.reason ?? "";
    if (/black ?list|block ?list|blocked/i.test(reason)) return BLOCKLIST_MESSAGE;
    if (/exceeds balance/i.test(reason)) return messages.ERC20InsufficientBalance([]);
    if (/exceeds allowance/i.test(reason)) return messages.ERC20InsufficientAllowance([]);
    if (reason) return `The transaction would fail: ${reason}`;
  }

  const text = `${error.shortMessage} ${error.details ?? ""}`;
  if (/black ?list|block ?list/i.test(text)) return BLOCKLIST_MESSAGE;
  if (/user (rejected|denied)/i.test(text)) return "You cancelled the request in your wallet.";
  return error.shortMessage || "Something went wrong.";
}
