import { expect, test } from "@playwright/test";

import { allowanceCount, pauseAllowance, seedAllowance, setBlocked } from "./setup";
import { ACCOUNTS, connect, installWallet, revert, sentFees, snapshot } from "./wallet";

let snap: string;
test.beforeEach(async () => {
  snap = await snapshot();
});
test.afterEach(async () => {
  await revert(snap);
});

test("spender sees granted allowances and spends within the limit", async ({ page }) => {
  await seedAllowance();
  await installWallet(page, ACCOUNTS.spender);
  await page.goto("/spend");
  await connect(page);

  const card = page.locator("[data-slot=card]").filter({ hasText: "every 7 days" });
  await expect(card).toContainText("20.00 of 20.00 left this period");
  await card.getByRole("button", { name: "Spend" }).click();

  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Recipient").fill(ACCOUNTS.recipient);
  await dialog.getByLabel("Amount").fill("25");
  await expect(dialog.getByText("Only 20.00 USDC is left this period.")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Send", exact: true })).toBeDisabled();

  await dialog.getByLabel("Amount").fill("12.5");
  await dialog.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByText(/Finalized in ~[\d,]+ ms/).first()).toBeVisible();
  await expect(card).toContainText("7.50 of 20.00 left this period");

  for (const fee of await sentFees(page)) expect(BigInt(fee)).toBeGreaterThanOrEqual(20_000_000_000n);
});

test("a blocklisted recipient shows a plain error", async ({ page }) => {
  await seedAllowance();
  await setBlocked(ACCOUNTS.recipient);
  await installWallet(page, ACCOUNTS.spender);
  await page.goto("/spend");
  await connect(page);

  await page.getByRole("button", { name: "Spend" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Recipient").fill(ACCOUNTS.recipient);
  await dialog.getByLabel("Amount").fill("1");
  await dialog.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByText(/Circle's blocklist/)).toBeVisible();
  // Nothing was sent: the failure was caught before the wallet was asked.
  expect(await sentFees(page)).toHaveLength(0);
});

test("a paused allowance can't be spent", async ({ page }) => {
  await seedAllowance();
  await pauseAllowance(await allowanceCount());
  await installWallet(page, ACCOUNTS.spender);
  await page.goto("/spend");
  await connect(page);

  const card = page.locator("[data-slot=card]").filter({ hasText: "every 7 days" });
  await expect(card.getByText("Paused", { exact: true })).toBeVisible();
  await expect(card.getByRole("button", { name: "Spend" })).toHaveCount(0);
});

test("a wallet with no allowances sees an empty state", async ({ page }) => {
  await installWallet(page, ACCOUNTS.recipient);
  await page.goto("/spend");
  await connect(page);
  await expect(page.getByText("No allowances for this wallet")).toBeVisible();
});
