import { expect, test, type Page } from "@playwright/test";

import { ACCOUNTS, connect, installWallet } from "./wallet";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const header = (page: Page) => page.locator("header");

async function openMenu(page: Page, name: string | RegExp) {
  await header(page).getByRole("button", { name }).click();
}

test("disconnect returns to the connect screen and stays disconnected after reload", async ({ page }) => {
  await installWallet(page, ACCOUNTS.owner);
  await page.goto("/");
  await connect(page);
  await expect(header(page).getByRole("button", { name: short(ACCOUNTS.owner) })).toBeVisible();

  await openMenu(page, short(ACCOUNTS.owner));
  await page.getByRole("menuitem", { name: "Disconnect" }).click();
  await expect(header(page).getByRole("button", { name: "Connect wallet" })).toBeVisible();

  await page.reload();
  await expect(header(page).getByRole("button", { name: "Connect wallet" })).toBeVisible();
});

test("switch account follows the account picked in the wallet", async ({ page }) => {
  await installWallet(page, ACCOUNTS.owner, { accounts: [ACCOUNTS.owner, ACCOUNTS.spender] });
  await page.goto("/");
  await connect(page);
  // Connecting opens the picker once, which lands on the spender; switch back to the owner first.
  const first = header(page).getByRole("button", { name: /^0x/ });
  const start = (await first.textContent())!.trim();
  const other = start === short(ACCOUNTS.owner) ? ACCOUNTS.spender : ACCOUNTS.owner;

  await openMenu(page, start);
  await page.getByRole("menuitem", { name: "Switch account" }).click();
  await expect(header(page).getByRole("button", { name: short(other) })).toBeVisible();
  await expect(page.getByText(`Switched to ${short(other)}`)).toBeVisible();
});

test("change wallet disconnects and opens the wallet picker", async ({ page }) => {
  await installWallet(page, ACCOUNTS.owner);
  await page.goto("/");
  await connect(page);

  await openMenu(page, short(ACCOUNTS.owner));
  await page.getByRole("menuitem", { name: "Change wallet" }).click();
  const dialog = page.getByRole("dialog", { name: "Connect a wallet" });
  await expect(dialog).toBeVisible();

  await dialog.getByRole("button", { name: /Browser wallet/ }).click();
  await expect(dialog).toBeHidden();
  await expect(header(page).getByRole("button", { name: short(ACCOUNTS.owner) })).toBeVisible();
});

test("on the wrong network the menu offers switching network and disconnecting", async ({ page }) => {
  await installWallet(page, ACCOUNTS.owner);
  await page.goto("/");
  await connect(page);
  await expect(header(page).getByRole("button", { name: short(ACCOUNTS.owner) })).toBeVisible();
  await page.evaluate(() => (window as unknown as { __walletSetChain: (id: number) => void }).__walletSetChain(1));

  await openMenu(page, "Wrong network");
  await expect(page.getByRole("menuitem", { name: "Disconnect" })).toBeVisible();
  await page.getByRole("menuitem", { name: /Switch to/ }).click();
  await expect(header(page).getByRole("button", { name: short(ACCOUNTS.owner) })).toBeVisible();

  await openMenu(page, short(ACCOUNTS.owner));
  await page.getByRole("menuitem", { name: "Disconnect" }).click();
  await expect(header(page).getByRole("button", { name: "Connect wallet" })).toBeVisible();
});
