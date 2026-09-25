import { getAddress, isAddress, type Address } from "viem";
import { ARC_USDC, chains, type NetworkName } from "./chains";

function parseNetwork(value: string | undefined): NetworkName {
  return value === "mainnet" || value === "local" ? value : "testnet";
}

function parseAddress(value: string | undefined): Address | undefined {
  return value && isAddress(value) ? getAddress(value) : undefined;
}

export const network = parseNetwork(process.env.NEXT_PUBLIC_CHAIN);
export const chain = chains[network];

/** The deployed Tap contract, or undefined when the app is not configured yet. */
export const tapAddress = parseAddress(process.env.NEXT_PUBLIC_TAP_ADDRESS);

/** USDC is fixed on Arc; only a local chain may point at a mock token. */
export const usdcAddress: Address =
  network === "local" ? (parseAddress(process.env.NEXT_PUBLIC_USDC_ADDRESS) ?? ARC_USDC) : ARC_USDC;

export const explorerUrl = chain.blockExplorers?.default.url;

export function txUrl(hash: string) {
  return explorerUrl ? `${explorerUrl}/tx/${hash}` : undefined;
}

export function addressUrl(address: string) {
  return explorerUrl ? `${explorerUrl}/address/${address}` : undefined;
}
