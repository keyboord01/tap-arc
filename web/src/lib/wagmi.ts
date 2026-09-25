import { cookieStorage, createConfig, createStorage, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { chain } from "./config";

export const wagmiConfig = createConfig({
  chains: [chain],
  connectors: [injected()],
  transports: { [chain.id]: http() },
  // Arc blocks land every ~0.5s; poll quickly so receipts and reads feel instant.
  pollingInterval: 500,
  ssr: true,
  // Cookies let the server render the connected state, so returning users don't see a flash.
  storage: createStorage({ storage: cookieStorage }),
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
