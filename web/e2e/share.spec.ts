import { expect, test } from "@playwright/test";

import { allowanceCount, seedAllowance } from "./setup";
import { ACCOUNTS, connect, installWallet, revert, settle, snapshot } from "./wallet";

let snap: string;
test.beforeEach(async () => {
  snap = await snapshot();
});
test.afterEach(async () => {
  await revert(snap);
});

test("owner copies a share link that opens the spender's view", async ({ page, context, browser, browserName }) => {
  test.skip(browserName !== "chromium", "clipboard permissions are Chromium-only");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await seedAllowance();
  const id = await allowanceCount();

  await installWallet(page, ACCOUNTS.owner);
  await page.goto("/app");
  await connect(page);
  await page.getByRole("button", { name: "Allowance actions" }).click();
  await page.getByRole("menuitem", { name: "Copy share link" }).click();
  await expect(page.getByText("Share link copied")).toBeVisible();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toMatch(new RegExp(`/app/a/${id}$`));

  // The spender opens the link on their own device and spends from it directly.
  const spenderContext = await browser.newContext({ viewport: page.viewportSize() ?? undefined });
  const spenderPage = await spenderContext.newPage();
  await installWallet(spenderPage, ACCOUNTS.spender);
  await spenderPage.goto(link);
  await expect(spenderPage.getByRole("heading", { name: "Your USDC allowance" })).toBeVisible();
  await connect(spenderPage);
  await spenderPage.getByRole("button", { name: "Spend" }).click();
  const dialog = spenderPage.getByRole("dialog");
  await dialog.getByRole("button", { name: "Send to my wallet" }).click();
  await dialog.getByLabel("Amount").fill("3");
  await dialog.getByRole("button", { name: "Send", exact: true }).click();
  await expect(spenderPage.getByText(/Finalized in ~[\d,]+ ms/).first()).toBeVisible();
  await settle(spenderPage);
  await expect(spenderPage.locator("[data-slot=card]")).toContainText("17.00 of 20.00 left this period");
  await spenderContext.close();
});

test("another wallet is told to switch to the spender", async ({ page }) => {
  await seedAllowance();
  const id = await allowanceCount();
  await installWallet(page, ACCOUNTS.recipient);
  await page.goto(`/app/a/${id}`);
  await expect(page.getByText(/Connect 0x7099…79C8 to spend/)).toBeVisible();
  await connect(page);
  await expect(page.getByText(/this allowance is for 0x7099…79C8/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Spend" })).toHaveCount(0);
});

test("an unknown id shows not found", async ({ page }) => {
  await page.goto("/app/a/999");
  await expect(page.getByText("Allowance not found")).toBeVisible();
});
