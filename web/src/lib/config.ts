import { getAddress, isAddress, type Address } from "viem";
import { ARC_USDC, chains, type NetworkName } from "./chains";

function parseNetwork(value: string | undefined): NetworkName {
  const v = value?.trim().toLowerCase();
  return v === "mainnet" || v === "local" ? v : "testnet";
}

/** Accepts any letter case and ignores stray whitespace or quotes from copy-pasting. */
function parseAddress(value: string | undefined): Address | undefined {
  const v = value?.trim().replace(/^["']|["']$/g, "");
  return v && isAddress(v, { strict: false }) ? getAddress(v.toLowerCase()) : undefined;
}

export const network = parseNetwork(process.env.NEXT_PUBLIC_CHAIN);
export const chain = chains[network];

/** The deployed Tap contract, or undefined when the app is not configured yet. */
export const tapAddress = parseAddress(process.env.NEXT_PUBLIC_TAP_ADDRESS);

/** Set but unusable, so the not-configured screen can say what's wrong. */
export const tapAddressInvalid = !tapAddress && !!process.env.NEXT_PUBLIC_TAP_ADDRESS?.trim();

/** Block the contract was deployed in; the activity feed never scans below it. */
export const tapDeployBlock = (() => {
  const raw = process.env.NEXT_PUBLIC_TAP_DEPLOY_BLOCK?.trim();
  return raw && /^\d+$/.test(raw) ? BigInt(raw) : 0n;
})();

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
