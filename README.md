# Tap

**Spending allowances for USDC, enforced onchain.** Tap lets an owner lock USDC in a vault and give other
addresses allowances with rules the contract enforces, for example:

> `0xabc…` can spend up to **20 USDC every 7 days**, until **December 31**.

It's built for the people and agents you pay regularly: family members, freelancers, and AI agents.

| | |
| --- | --- |
| **Live app** | _TBD: live URL_ |
| **Contract (Arc mainnet)** | _TBD: `0x…` ([explorer](https://explorer.arc.io))_ |
| **Contract (Arc testnet)** | _TBD: `0x…` ([explorer](https://explorer.testnet.arc.io))_ |

## What it does

- **One vault, many spenders.** Each owner has a USDC vault. They can grant any number of allowances from it,
  each with its own spender, limit, reset period and optional end date.
- **Budgets that reset.** Limits apply per fixed period (e.g. every 7 days or every 30 days) counted from the
  allowance's start, and roll over automatically. Unused budget doesn't carry over.
- **Full owner control.** Edit the limit, period or end date; pause and resume; revoke permanently; withdraw
  any time. Allowances never lock funds.
- **A link for each spender.** Owners copy a share link for an allowance. It opens the spender's view: what's
  left this period, when it resets, and a form to send USDC to any recipient.
- **Visible finality.** Every transaction toast goes from pending to finalized and shows how many
  milliseconds that took.
- **Plain-language errors.** Custom contract errors (limit reached, vault short, paused, expired, revoked,
  blocklisted recipient…) are decoded into clear messages, usually before the wallet even opens.

### How Tap differs

Existing agent-wallet guardrails give one agent wallet per vault with a recipient allowlist and daily caps.
Tap is for **many spenders per vault**, for **people as well as agents**, with **7-day and 30-day budgets**,
a **share link** for each spender, and **visible finality timing**.

## Why Arc

- **USDC is the gas token.** Owners and spenders only ever need USDC: no second token to buy for fees.
- **Sub-second, deterministic finality.** Blocks land every ~0.5 s and are final on inclusion (no reorgs),
  so a spend is done when it's included. The UI shows the measured time.
- **Native USDC at a fixed address** (`0x3600…0000`) on mainnet and testnet, with Circle's blocklist
  applying to transfers. Tap surfaces blocklist reverts as a clear message.

## Architecture

```
contracts/              Foundry project
  src/Tap.sol           The whole protocol: vaults + allowances (~260 lines)
  src/interfaces/ITap.sol  Allowance struct, events, custom errors, external interface
  test/                 Unit, fuzz, reentrancy and (env-gated) fork tests
  script/Deploy.s.sol   Deploys to Arc with a Foundry keystore account (--account)
  script/DeployLocal.s.sol  Anvil only: mock USDC + Tap + test funds

web/                    Next.js 16 (App Router), React 19, Tailwind v4, shadcn/ui, wagmi 3, viem 2
  src/lib/chains.ts     Arc mainnet/testnet (URLs overridable via env) and local anvil
  src/lib/allowance.ts  Client mirror of the contract's period math (countdowns update at rollover)
  src/lib/errors.ts     Custom error → plain message decoding
  src/lib/fees.ts       20 gwei minimum fee floor applied to every transaction
  src/hooks/use-tx.ts   simulate → send → wait; toasts with finality time
  src/hooks/use-activity.ts  Event feed: chunked history + polling
  e2e/                  Playwright tests against a local anvil chain
```

**State comes from contract reads, not event indexing.** Balances and allowances are read directly
(`vaultBalance`, `allowancesByOwner`, `allowancesBySpender`, `getAllowance`). Arc's RPC limits log queries to
about 5,000 blocks and 2,000 results, so the activity feed loads recent history backwards in 5,000-block
chunks (splitting a range if it hits the result cap) and then polls for new blocks. No backend or indexer is
needed.

## Contract

`Tap` holds every owner's vault in one contract. Balances are tracked **only** in internal accounting;
the contract never reads its own token balance, so USDC sent to it directly isn't credited to anyone.
It has no payable functions, `receive` or `fallback`, so native value sent to it reverts.

### Interface

```solidity
// Vault
function deposit(uint256 amount) external;                 // pulls USDC (approve first)
function withdraw(uint256 amount) external;                // to the caller, any time
function vaultBalance(address owner) external view returns (uint256);

// Allowances (owner)
function createAllowance(address spender, uint256 amountPerPeriod, uint64 periodLength,
                         uint64 start /* 0 = now */, uint64 expiry /* 0 = never */) external returns (uint256 id);
function editAllowance(uint256 id, uint256 amountPerPeriod, uint64 periodLength, uint64 expiry) external;
function pause(uint256 id) external;
function unpause(uint256 id) external;
function revoke(uint256 id) external;                      // permanent

// Spending (spender)
function spend(uint256 id, address to, uint256 amount) external;

// Views
function getAllowance(uint256 id) external view returns (Allowance memory);
function allowanceCount() external view returns (uint256);
function allowancesByOwner(address owner) external view returns (uint256[] memory);
function allowancesBySpender(address spender) external view returns (uint256[] memory);
function currentPeriod(uint256 id) external view returns (uint64 index, uint64 periodStart, uint64 periodEnd);
function remaining(uint256 id) external view returns (uint256);   // left of this period's limit
function spendable(uint256 id) external view returns (uint256);   // 0 if unusable, else min(remaining, vault)
```

Events: `Deposited`, `Withdrawn`, `AllowanceCreated`, `AllowanceEdited`, `AllowancePaused`,
`AllowanceUnpaused`, `AllowanceRevoked`, `Spent`.
Errors: `ZeroAmount`, `ZeroAddress`, `ZeroPeriod`, `InvalidExpiry`, `InvalidToken`,
`InsufficientVaultBalance`, `AllowanceNotFound`, `NotOwner`, `NotSpender`, `NotStarted`, `Expired`, `Paused`,
`NotPaused`, `Revoked`, `LimitExceeded`.

### Rules

- Periods are fixed windows of `periodLength` seconds from `start`; the current period is
  `(now − start) / periodLength`. Only division and `>=` are used on timestamps, so repeated timestamps across
  blocks (Arc has 1-second precision) always land in the same period.
- `expiry` is the first second the allowance stops working.
- Allowances don't reserve funds: the total promised can exceed the vault, and `spend` fails with
  `InsufficientVaultBalance` when the vault can't cover it.
- Editing: lowering the limit below what was already spent this period leaves 0 remaining (no underflow);
  the spender can't be changed (create a new allowance); changing `periodLength` starts a fresh period now.
- `SafeERC20`, checks-effects-interactions, and a reentrancy guard on every state-changing function.
- USDC is used only through its ERC-20 interface (6 decimals); the constructor rejects any other decimals.

## Run it locally

Requirements: [Foundry](https://book.getfoundry.sh), Node 22+, pnpm 10.

```bash
git clone --recurse-submodules https://github.com/keyboord01/tap-arc && cd tap-arc

# 1. Contracts: build and test
cd contracts
forge build
forge test

# 2. Local chain with a mock USDC and Tap (uses anvil's unlocked dev accounts)
anvil
forge script script/DeployLocal.s.sol --rpc-url http://127.0.0.1:8545 --broadcast \
  --unlocked --sender 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
# prints NEXT_PUBLIC_TAP_ADDRESS and NEXT_PUBLIC_USDC_ADDRESS

# 3. Web app
cd ../web
pnpm install
cat > .env.local <<'ENV'
NEXT_PUBLIC_CHAIN=local
NEXT_PUBLIC_TAP_ADDRESS=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
NEXT_PUBLIC_USDC_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
ENV
pnpm dev
```

Add the anvil network (chain ID 31337, RPC `http://127.0.0.1:8545`) to your browser wallet and import one of
anvil's dev accounts to try it.

To use Arc testnet instead, set `NEXT_PUBLIC_CHAIN=testnet` and `NEXT_PUBLIC_TAP_ADDRESS` to a testnet
deployment, and get test USDC from [faucet.circle.com](https://faucet.circle.com).

### Tests

```bash
cd contracts && forge test                       # unit, fuzz and reentrancy tests
ARC_TESTNET_RPC=https://rpc.testnet.arc.io forge test --match-contract TapForkTest   # real testnet USDC

cd web
pnpm lint && pnpm typecheck && pnpm test         # unit tests for fees, errors, period math, formatting
pnpm e2e                                         # Playwright flows; needs anvil + DeployLocal running
```

## Configuration

| Variable | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_CHAIN` | web | `testnet` (default), `mainnet` or `local` |
| `NEXT_PUBLIC_TAP_ADDRESS` | web | Deployed Tap address. Unset shows a "contract not configured" screen |
| `NEXT_PUBLIC_TAP_DEPLOY_BLOCK` | web | Optional. Block the activity feed stops scanning at |
| `NEXT_PUBLIC_ARC_MAINNET_RPC_URL` | web | Optional RPC override (default `https://rpc.mainnet.arc.io`) |
| `NEXT_PUBLIC_ARC_TESTNET_RPC_URL` | web | Optional RPC override (default `https://rpc.testnet.arc.io`) |
| `NEXT_PUBLIC_ARC_TESTNET_WS_URL` | web | Optional WebSocket override (default `wss://rpc.testnet.arc.io`) |
| `NEXT_PUBLIC_LOCAL_RPC_URL`, `NEXT_PUBLIC_USDC_ADDRESS` | web | Local development only |
| `ARC_TESTNET_RPC_URL`, `ARC_MAINNET_RPC_URL` | contracts | RPC endpoints for `forge script` (see `contracts/.env.example`) |
| `ARC_TESTNET_RPC` | contracts | Enables the fork test |

`NEXT_PUBLIC_*` values are read at build time; redeploy after changing them.

## Deploying the contract

The deploy script signs with a [Foundry keystore](https://book.getfoundry.sh/reference/cast/cast-wallet-import)
account, so no private key is ever passed on the command line or stored in `.env`.

```bash
cd contracts
forge script script/Deploy.s.sol --rpc-url arc_testnet --account <keystore-name> --broadcast
forge script script/Deploy.s.sol --rpc-url arc_mainnet --account <keystore-name> --broadcast
```

The script refuses to run on any chain other than Arc mainnet (5042) or testnet (5042002).

## Transactions on Arc

- Every transaction the app sends offers at least **20 gwei** per gas; Arc silently drops anything lower.
- Deposits approve **exactly** the amount being deposited, never an unlimited approval.
- Every call is simulated before the wallet opens, so a revert is explained up front instead of failing
  onchain.

## License

MIT
