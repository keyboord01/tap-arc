import { expect, test } from "@playwright/test";

import { ACCOUNTS, connect, installWallet, revert, sentFees, snapshot } from "./wallet";

let snap: string;
test.beforeEach(async () => {
  snap = await snapshot();
});
test.afterEach(async () => {
  await revert(snap);
});

test("owner deposits, creates, edits, pauses and revokes an allowance", async ({ page }) => {
  await installWallet(page, ACCOUNTS.owner);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Connect to open your vault" })).toBeVisible();
  await connect(page);

  // Empty vault.
  await expect(page.getByText("No allowances yet")).toBeVisible();

  // Deposit needs an approval first; both run from one click.
  await page.getByRole("button", { name: "Deposit" }).first().click();
  await page.getByLabel("Amount").fill("100");
  await expect(page.getByText(/two confirmations/)).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Deposit" }).click();
  await expect(page.getByText(/Finalized in ~[\d,]+ ms/).first()).toBeVisible();
  await expect(page.getByTestId("vault-balance")).toHaveText(/^100\.00/);

  // Create 20 USDC every 7 days for the spender.
  await page.getByRole("button", { name: "New allowance" }).first().click();
  await page.getByLabel("Spender address").fill(ACCOUNTS.spender);
  await page.getByLabel("Limit per period").fill("20");
  await page.getByRole("dialog").getByRole("button", { name: "Create allowance" }).click();
  const card = page.locator("[data-slot=card]").filter({ hasText: "every 7 days" });
  await expect(card).toBeVisible();
  await expect(card.getByText("left this period")).toContainText("of 20.00 left this period");
  await expect(card.getByText(/resets in 6d 23h/)).toBeVisible();

  // Promise more than the vault holds -> overcommitment warning.
  await card.getByRole("button", { name: "Allowance actions" }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();
  await page.getByLabel("Limit per period").fill("150");
  await page.getByRole("radio", { name: "Every 30 days" }).click();
  await expect(page.getByText(/starts a fresh period now/)).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByText("150.00 USDC every 30 days")).toBeVisible();
  await expect(page.getByText("Your allowances promise more than your vault holds.")).toBeVisible();

  // Pause and resume.
  const edited = page.locator("[data-slot=card]").filter({ hasText: "every 30 days" });
  await edited.getByRole("button", { name: "Allowance actions" }).click();
  await page.getByRole("menuitem", { name: "Pause" }).click();
  await expect(edited.getByText("Paused", { exact: true })).toBeVisible();
  await expect(page.getByText("Your allowances promise more than your vault holds.")).toBeHidden();
  await edited.getByRole("button", { name: "Allowance actions" }).click();
  await page.getByRole("menuitem", { name: "Resume" }).click();
  await expect(edited.getByText("Active", { exact: true })).toBeVisible();

  // Revoke, with confirmation.
  await edited.getByRole("button", { name: "Allowance actions" }).click();
  await page.getByRole("menuitem", { name: "Revoke" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Revoke" }).click();
  await expect(page.getByRole("button", { name: /Show 1 ended allowance/ })).toBeVisible();

  // Withdraw.
  await page.getByRole("button", { name: "Withdraw" }).click();
  await page.getByLabel("Amount").fill("40");
  await page.getByRole("dialog").getByRole("button", { name: "Withdraw" }).click();
  await expect(page.getByTestId("vault-balance")).toHaveText(/^60\.00/);

  const fees = await sentFees(page);
  expect(fees.length).toBeGreaterThanOrEqual(7);
  for (const fee of fees) expect(BigInt(fee)).toBeGreaterThanOrEqual(20_000_000_000n);
});
