import { afterEach, describe, expect, it, vi } from "vitest";

async function load(env: Record<string, string>) {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  return import("./config");
}

afterEach(() => vi.unstubAllEnvs());

describe("config", () => {
  it("accepts lowercase, whitespace and quoted addresses", async () => {
    const want = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    for (const raw of [want.toLowerCase(), ` ${want} `, `"${want}"`, want.toUpperCase().replace("0X", "0x")]) {
      const c = await load({ NEXT_PUBLIC_TAP_ADDRESS: raw });
      expect(c.tapAddress).toBe(want);
    }
  });

  it("flags a set but invalid address", async () => {
    const c = await load({ NEXT_PUBLIC_TAP_ADDRESS: "0x123" });
    expect(c.tapAddress).toBeUndefined();
    expect(c.tapAddressInvalid).toBe(true);
  });

  it("treats an empty value as not configured", async () => {
    const c = await load({ NEXT_PUBLIC_TAP_ADDRESS: "" });
    expect(c.tapAddress).toBeUndefined();
    expect(c.tapAddressInvalid).toBe(false);
  });

  it("parses the network name loosely and defaults to testnet", async () => {
    expect((await load({ NEXT_PUBLIC_CHAIN: " Mainnet " })).network).toBe("mainnet");
    expect((await load({ NEXT_PUBLIC_CHAIN: "" })).network).toBe("testnet");
  });
});
