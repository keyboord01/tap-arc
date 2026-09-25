import { expect, test } from "@playwright/test";
import { encodeFunctionData } from "viem";

import { tapAbi } from "../src/lib/tap-abi";
import { allowanceCount, seedAllowance } from "./setup";
import { ACCOUNTS, TAP, connect, installWallet, revert, sendAs, snapshot } from "./wallet";

let snap: string;
test.beforeEach(async () => {
  snap = await snapshot();
});
test.afterEach(async () => {
  await revert(snap);
});

test("the feed shows the viewer's history and updates live", async ({ page }) => {
  await seedAllowance();
  const id = await allowanceCount();
  await installWallet(page, ACCOUNTS.spender);
  await page.goto("/app/activity");
  await connect(page);

  await expect(page.getByText(`0xf39F…2266 gave you 20.00 USDC every 7 days (allowance #${id})`)).toBeVisible();
  // The owner's deposit doesn't involve the spender.
  await expect(page.getByText(/deposited/)).toHaveCount(0);

  // A spend made elsewhere appears without reloading.
  await sendAs(
    ACCOUNTS.spender,
    TAP,
    encodeFunctionData({ abi: tapAbi, functionName: "spend", args: [id, ACCOUNTS.recipient, 2_000_000n] }),
  );
  await expect(page.getByText(`You sent 2.00 USDC to 0x3C44…93BC from allowance #${id}`)).toBeVisible();
  await expect(page.locator("li").first()).toContainText("You sent 2.00 USDC");
});

test("without a wallet, all recent contract activity is shown", async ({ page }) => {
  await seedAllowance();
  await page.goto("/app/activity");
  await expect(page.getByText("0xf39F…2266 deposited 100.00 USDC")).toBeVisible();
});
