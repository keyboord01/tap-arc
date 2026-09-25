"use client";

import { useMemo } from "react";
import { erc20Abi, type Address } from "viem";
import { useReadContract, useReadContracts } from "wagmi";

import type { Allowance } from "@/lib/allowance";
import { chain, tapAddress, usdcAddress } from "@/lib/config";
import { tapAbi } from "@/lib/tap-abi";

// Components using these hooks only render once `tapAddress` is configured.
const tap = { address: tapAddress as Address, abi: tapAbi, chainId: chain.id } as const;
const usdc = { address: usdcAddress, abi: erc20Abi, chainId: chain.id } as const;

const LIVE = { refetchInterval: 4_000 } as const;

/** The owner's vault balance, wallet USDC balance and USDC approval for Tap. */
export function useVault(owner: Address | undefined) {
  const query = useReadContracts({
    contracts: [
      { ...tap, functionName: "vaultBalance", args: [owner!] },
      { ...usdc, functionName: "balanceOf", args: [owner!] },
      { ...usdc, functionName: "allowance", args: [owner!, tapAddress as Address] },
    ],
    allowFailure: false,
    query: { enabled: !!owner, ...LIVE },
  });
  const [vaultBalance, walletBalance, approved] = query.data ?? [];
  return { vaultBalance, walletBalance, approved, isLoading: query.isLoading, error: query.error };
}

/** Allowance ids where `account` is the owner or the spender. */
export function useAllowanceIds(role: "owner" | "spender", account: Address | undefined) {
  return useReadContract({
    ...tap,
    functionName: role === "owner" ? "allowancesByOwner" : "allowancesBySpender",
    args: [account!],
    query: { enabled: !!account, ...LIVE },
  });
}

/** Full allowance records for `ids`, plus the vault balance of every owner involved. */
export function useAllowances(ids: readonly bigint[] | undefined) {
  const records = useReadContracts({
    contracts: (ids ?? []).map((id) => ({ ...tap, functionName: "getAllowance", args: [id] }) as const),
    allowFailure: false,
    query: { enabled: !!ids && ids.length > 0, ...LIVE },
  });

  const allowances = useMemo<Allowance[] | undefined>(() => {
    if (!ids) return undefined;
    if (ids.length === 0) return [];
    return records.data?.map((a, i) => ({ id: ids[i], ...a }));
  }, [ids, records.data]);

  const owners = useMemo(() => [...new Set(allowances?.map((a) => a.owner) ?? [])], [allowances]);
  const balances = useReadContracts({
    contracts: owners.map((owner) => ({ ...tap, functionName: "vaultBalance", args: [owner] }) as const),
    allowFailure: false,
    query: { enabled: owners.length > 0, ...LIVE },
  });

  const vaultBalances = useMemo(() => {
    const map = new Map<Address, bigint>();
    balances.data?.forEach((b, i) => map.set(owners[i], b));
    return map;
  }, [balances.data, owners]);

  return {
    allowances,
    vaultBalances,
    isLoading: records.isLoading || balances.isLoading,
    error: records.error ?? balances.error,
  };
}

/** Every allowance for one role, newest first. */
export function useMyAllowances(role: "owner" | "spender", account: Address | undefined) {
  const ids = useAllowanceIds(role, account);
  const reversed = useMemo(() => (ids.data ? [...ids.data].reverse() : undefined), [ids.data]);
  const result = useAllowances(reversed);
  return { ...result, isLoading: ids.isLoading || result.isLoading, error: ids.error ?? result.error };
}
