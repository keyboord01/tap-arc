"use client";

import { useCallback, useState } from "react";
import { createElement } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Abi, Address, ContractFunctionArgs, ContractFunctionName } from "viem";
import { useAccount, useSwitchChain } from "wagmi";
import {
  simulateContract,
  waitForTransactionReceipt,
  writeContract,
  type SimulateContractParameters,
  type WriteContractParameters,
} from "wagmi/actions";

import { chain, txUrl } from "@/lib/config";
import { describeError, tokenErrorsAbi } from "@/lib/errors";
import { arcFees } from "@/lib/fees";
import { wagmiConfig } from "@/lib/wagmi";

export type TxRequest<
  abi extends Abi = Abi,
  fn extends ContractFunctionName<abi, "nonpayable"> = ContractFunctionName<abi, "nonpayable">,
> = {
  address: Address;
  abi: abi;
  functionName: fn;
  args: ContractFunctionArgs<abi, "nonpayable", fn>;
};

export type TxStep = { title: string; request: TxRequest };

/** Type-checks a contract call against its ABI and packages it as a step for `run`. */
export function txStep<abi extends Abi, fn extends ContractFunctionName<abi, "nonpayable">>(
  title: string,
  request: TxRequest<abi, fn>,
): TxStep {
  return { title, request: request as unknown as TxRequest };
}

function explorerLink(hash: string) {
  const url = txUrl(hash);
  return url ? { label: "View", onClick: () => window.open(url, "_blank", "noopener") } : undefined;
}

/**
 * Sends one or more contract transactions in order, with a toast that goes
 * wallet → pending → finalized (with the time from broadcast to inclusion).
 * Every transaction is simulated first so reverts show a clear message before
 * the wallet opens, and every transaction offers at least Arc's 20 gwei minimum fee.
 */
export function useTx() {
  const { address, chainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  const run = useCallback(
    async (steps: TxStep[]): Promise<boolean> => {
      if (!address) {
        toast.error("Connect a wallet first.");
        return false;
      }
      setBusy(true);
      try {
        if (chainId !== chain.id) await switchChainAsync({ chainId: chain.id });

        for (const step of steps) {
          const id = toast.loading(step.title, { description: "Confirm in your wallet…" });
          try {
            const { request } = await simulateContract(wagmiConfig, {
              ...step.request,
              // Include USDC's errors so a revert inside the token transfer still decodes.
              abi: [...step.request.abi, ...tokenErrorsAbi],
              account: address,
              chainId: chain.id,
            } as SimulateContractParameters);
            const fees = await arcFees();
            const hash = await writeContract(wagmiConfig, {
              ...request,
              ...fees,
              type: "eip1559",
            } as WriteContractParameters);
            const sentAt = performance.now();
            toast.loading(step.title, { id, description: "Pending…", action: explorerLink(hash) });

            const receipt = await waitForTransactionReceipt(wagmiConfig, {
              hash,
              chainId: chain.id,
              pollingInterval: 100,
            });
            const ms = Math.round(performance.now() - sentAt);
            if (receipt.status !== "success") throw new Error("The transaction reverted.");

            toast.success(step.title, {
              id,
              description: createElement(
                "span",
                null,
                "Finalized in ",
                createElement("span", { className: "font-mono tabular-nums" }, `~${ms.toLocaleString()} ms`),
              ),
              action: explorerLink(hash),
            });
          } catch (error) {
            toast.error(`${step.title} failed`, { id, description: describeError(error) });
            return false;
          } finally {
            await queryClient.invalidateQueries();
          }
        }
        return true;
      } catch (error) {
        toast.error(describeError(error));
        return false;
      } finally {
        setBusy(false);
      }
    },
    [address, chainId, switchChainAsync, queryClient],
  );

  return { run, busy };
}
