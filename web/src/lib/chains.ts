import { defineChain, type Chain } from "viem";
import { arc, arcTestnet as viemArcTestnet } from "viem/chains";

/** USDC's ERC-20 interface on Arc (6 decimals). Same address on mainnet and testnet. */
export const ARC_USDC = "0x3600000000000000000000000000000000000000" as const;

const mainnetRpc = process.env.NEXT_PUBLIC_ARC_MAINNET_RPC_URL || "https://rpc.mainnet.arc.io";
const testnetRpc = process.env.NEXT_PUBLIC_ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.io";
const testnetWs = process.env.NEXT_PUBLIC_ARC_TESTNET_WS_URL || "wss://rpc.testnet.arc.io";
const localRpc = process.env.NEXT_PUBLIC_LOCAL_RPC_URL || "http://127.0.0.1:8545";

/** Arc mainnet. HTTP only: the public endpoint has no WebSocket. */
export const arcMainnet = defineChain({
  ...arc,
  rpcUrls: { default: { http: [mainnetRpc] } },
  blockExplorers: { default: { name: "Arc Explorer", url: "https://explorer.arc.io" } },
});

/** Arc testnet. viem's built-in entry has outdated URLs, so they are replaced here. */
export const arcTestnet = defineChain({
  ...viemArcTestnet,
  rpcUrls: { default: { http: [testnetRpc], webSocket: [testnetWs] } },
  blockExplorers: { default: { name: "Arc Testnet Explorer", url: "https://explorer.testnet.arc.io" } },
});

/** A local anvil chain, for development against a locally deployed Tap and mock USDC. */
export const localArc = defineChain({
  id: 31337,
  name: "Local (anvil)",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [localRpc] } },
  testnet: true,
});

export type NetworkName = "mainnet" | "testnet" | "local";

export const chains: Record<NetworkName, Chain> = {
  mainnet: arcMainnet,
  testnet: arcTestnet,
  local: localArc,
};
