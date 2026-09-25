import type { Page } from "@playwright/test";

export const RPC = process.env.E2E_RPC_URL ?? "http://127.0.0.1:8545";

/** anvil's default accounts. anvil keeps them unlocked, so no keys are involved. */
export const ACCOUNTS = {
  owner: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  spender: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  recipient: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
} as const;

export const TAP = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
export const USDC = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

/**
 * Injects a minimal EIP-1193 wallet that forwards everything to anvil and
 * records each eth_sendTransaction so tests can check the fees offered.
 */
export async function installWallet(page: Page, account: string) {
  await page.addInitScript(
    ({ rpc, account }) => {
      const sent: unknown[] = [];
      (window as unknown as { __sentTxs: unknown[] }).__sentTxs = sent;
      let id = 0;
      const forward = async (method: string, params: unknown) => {
        const res = await fetch(rpc, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params: params ?? [] }),
        });
        const body = await res.json();
        if (body.error) throw Object.assign(new Error(body.error.message), body.error);
        return body.result;
      };
      (window as unknown as { ethereum: unknown }).ethereum = {
        isTestWallet: true,
        async request({ method, params }: { method: string; params?: unknown[] }) {
          switch (method) {
            case "eth_requestAccounts":
            case "eth_accounts":
              return [account];
            case "wallet_switchEthereumChain":
            case "wallet_addEthereumChain":
              return null;
            case "wallet_requestPermissions":
              return [{ parentCapability: "eth_accounts" }];
            case "eth_sendTransaction":
              sent.push(params?.[0]);
              return forward(method, params);
            default:
              return forward(method, params);
          }
        },
        on() {},
        removeListener() {},
      };
    },
    { rpc: RPC, account },
  );
}

export async function rpc<T = unknown>(method: string, params: unknown[] = []): Promise<T> {
  const res = await fetch(RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const body = await res.json();
  if (body.error) throw new Error(body.error.message);
  return body.result as T;
}

/** Snapshot/revert anvil state so each test starts from the same chain. */
export const snapshot = () => rpc<string>("evm_snapshot");
export const revert = (id: string) => rpc<boolean>("evm_revert", [id]);

export async function connect(page: Page) {
  const button = page.getByRole("button", { name: "Connect wallet" }).first();
  await button.click();
  await page.getByRole("button", { name: /Browser wallet/ }).click();
}

/** Every transaction the app sent must offer at least Arc's 20 gwei minimum fee. */
export async function sentFees(page: Page) {
  return page.evaluate(() =>
    ((window as unknown as { __sentTxs: { maxFeePerGas?: string; gasPrice?: string }[] }).__sentTxs ?? []).map(
      (tx) => BigInt(tx.maxFeePerGas ?? tx.gasPrice ?? "0x0").toString(),
    ),
  );
}

/** Send a transaction from an unlocked anvil account, to set up chain state for a test. */
export async function sendAs(from: string, to: string, data: string) {
  const hash = await rpc<string>("eth_sendTransaction", [{ from, to, data }]);
  for (let i = 0; i < 50; i++) {
    const receipt = await rpc<{ status: string } | null>("eth_getTransactionReceipt", [hash]);
    if (receipt) {
      if (receipt.status !== "0x1") throw new Error(`setup transaction reverted: ${hash}`);
      return;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("setup transaction not mined");
}

/** Wait for transaction toasts to clear so they don't cover the next click. */
export async function settle(page: Page) {
  await page.mouse.move(0, 0);
  await page.locator("[data-sonner-toast]").first().waitFor({ state: "detached", timeout: 15_000 }).catch(() => {});
}
