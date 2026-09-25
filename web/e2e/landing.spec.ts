import { expect, test, type Page } from "@playwright/test";

import { CONTRACT_SOURCE_URL } from "../src/lib/links";
import { TAP } from "./wallet";

/** Distinct play states of every animation inside the reel. */
const reelStates = (page: Page) =>
  page.evaluate(() => {
    const reel = document.querySelector("svg[role=img]")!.parentElement!.parentElement!;
    const targets = document.getAnimations().map((a) => (a.effect as KeyframeEffect).target as Node);
    return [...new Set(document.getAnimations().filter((_, i) => reel.contains(targets[i])).map((a) => a.playState))];
  });

const captions = [
  "You fill a vault with USDC.",
  "You open a tap for each spender.",
  "They spend, and it settles in under a second.",
  "Past the limit, the tap closes.",
  "Next period, it opens again.",
];

for (const width of [390, 768, 1024, 1440]) {
  test(`no horizontal scrolling at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "Spending limits for USDC, enforced by the chain." })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBe(0);
  });
}

test("links go to the app, the contract and the sections", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  for (const link of await page.getByRole("link", { name: "Open Tap" }).all()) {
    await expect(link).toHaveAttribute("href", "/app");
  }
  // The e2e build runs on anvil, which has no explorer, so this falls back to the source on GitHub.
  await expect(page.getByRole("link", { name: "Read the contract" })).toHaveAttribute("href", CONTRACT_SOURCE_URL);
  for (const id of ["how", "who", "why"]) {
    await expect(page.locator(`nav a[href="#${id}"]`).first()).toBeVisible();
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }
});

test("the reel is labelled and pauses off screen and in a hidden tab", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("img", { name: /a vault fills with USDC/ })).toBeVisible();
  await expect.poll(() => reelStates(page)).toEqual(["running"]);

  await page.locator("footer").scrollIntoViewIfNeeded();
  await expect.poll(() => reelStates(page)).toEqual(["paused"]);

  await page.locator("#top").scrollIntoViewIfNeeded();
  await expect.poll(() => reelStates(page)).toEqual(["running"]);

  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(() => reelStates(page)).toEqual(["paused"]);
});

test("reduced motion shows a still frame with the first caption", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  expect(await reelStates(page)).toEqual([]);
  const opacities = [];
  for (const text of captions) opacities.push(await page.getByText(text).evaluate((e) => getComputedStyle(e).opacity));
  expect(opacities).toEqual(["1", "0", "0", "0", "0"]);
});

test("on phones the section links live in a menu", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator('nav a[href="#how"]').first()).toBeHidden();
  await page.getByRole("button", { name: "Menu" }).click();
  await page.getByRole("link", { name: "Use cases" }).click();
  await expect(page.getByRole("button", { name: "Menu" })).toHaveAttribute("aria-expanded", "false");
  await expect.poll(() => page.evaluate(() => Math.round(document.getElementById("who")!.getBoundingClientRect().top))).toBeLessThan(5);
});

test("the CTA shows the contract address with a copy button", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  const short = `${TAP.slice(0, 6)}…${TAP.slice(-4)}`;
  // No explorer on anvil, so the address is shown without a link here.
  await expect(page.getByText(short)).toBeVisible();
  await page.getByRole("button", { name: "Copy contract address" }).click();
  await expect(page.getByRole("button", { name: "Address copied" })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(TAP);
});
