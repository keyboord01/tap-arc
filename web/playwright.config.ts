import { defineConfig, devices } from "@playwright/test";

// End-to-end tests against a local anvil chain. See e2e/README.md for setup.
const port = Number(process.env.E2E_PORT ?? 3200);

export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "retain-on-failure",
    ...(process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } }
      : {}),
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `pnpm build && pnpm start -p ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: true,
    timeout: 180_000,
    env: {
      NEXT_PUBLIC_CHAIN: "local",
      NEXT_PUBLIC_TAP_ADDRESS: process.env.E2E_TAP_ADDRESS ?? "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
      NEXT_PUBLIC_USDC_ADDRESS: process.env.E2E_USDC_ADDRESS ?? "0x5FbDB2315678afecb367f032d93F642f64180aa3",
      NEXT_PUBLIC_LOCAL_RPC_URL: "http://127.0.0.1:8545",
    },
  },
});
