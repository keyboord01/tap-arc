import { describe, expect, it } from "vitest";

import {
  backwardRanges,
  describeEvent,
  forwardRanges,
  isRelevant,
  sortEvents,
  timeAgo,
  type ActivityEvent,
} from "./activity";

const OWNER = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const SPENDER = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

function ev(name: ActivityEvent["name"], args: Record<string, unknown>, blockNumber = 1n, logIndex = 0): ActivityEvent {
  return { key: `${blockNumber}-${logIndex}`, name, args, blockNumber, logIndex, transactionHash: "0x00" };
}

describe("block ranges", () => {
  it("walks backwards in chunks of at most 5,000 blocks", () => {
    expect(backwardRanges(12_000n, 0n, 10)).toEqual([
      { from: 7_001n, to: 12_000n },
      { from: 2_001n, to: 7_000n },
      { from: 0n, to: 2_000n },
    ]);
  });

  it("stops at the floor and at the requested count", () => {
    expect(backwardRanges(12_000n, 9_000n, 10)).toEqual([{ from: 9_000n, to: 12_000n }]);
    expect(backwardRanges(100_000n, 0n, 2)).toHaveLength(2);
  });

  it("walks forwards for polling", () => {
    expect(forwardRanges(10n, 10_010n)).toEqual([
      { from: 10n, to: 5_009n },
      { from: 5_010n, to: 10_009n },
      { from: 10_010n, to: 10_010n },
    ]);
    expect(forwardRanges(11n, 10n)).toEqual([]);
  });
});

describe("events", () => {
  it("sorts newest first", () => {
    const sorted = sortEvents([ev("Deposited", {}, 1n, 0), ev("Deposited", {}, 2n, 0), ev("Deposited", {}, 2n, 3)]);
    expect(sorted.map((e) => e.key)).toEqual(["2-3", "2-0", "1-0"]);
  });

  it("filters to the viewer's events, including id-only events for their allowances", () => {
    const ids = new Set(["4"]);
    expect(isRelevant(ev("Deposited", { owner: OWNER }), OWNER, ids)).toBe(true);
    expect(isRelevant(ev("Deposited", { owner: SPENDER }), OWNER, ids)).toBe(false);
    expect(isRelevant(ev("AllowancePaused", { id: 4n }), OWNER, ids)).toBe(true);
    expect(isRelevant(ev("AllowancePaused", { id: 5n }), OWNER, ids)).toBe(false);
    expect(isRelevant(ev("AllowancePaused", { id: 5n }), undefined, ids)).toBe(true);
  });

  it("describes events from the viewer's point of view", () => {
    const created = ev("AllowanceCreated", {
      id: 1n,
      owner: OWNER,
      spender: SPENDER,
      amountPerPeriod: 20_000_000n,
      periodLength: 604_800n,
    });
    expect(describeEvent(created, OWNER)).toBe("You gave 0x7099…79C8 20.00 USDC every 7 days (allowance #1)");
    const spent = ev("Spent", { id: 1n, owner: OWNER, spender: SPENDER, to: OWNER, amount: 5_000_000n });
    expect(describeEvent(spent, OWNER)).toBe("0x7099…79C8 sent 5.00 USDC to you from allowance #1");
  });

  it("formats relative times", () => {
    expect(timeAgo(1000, 1005)).toBe("just now");
    expect(timeAgo(1000, 1000 + 3 * 3600)).toBe("3h ago");
  });
});
