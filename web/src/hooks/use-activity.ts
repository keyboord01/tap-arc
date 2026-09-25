"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Address } from "viem";
import { usePublicClient } from "wagmi";

import {
  backwardRanges,
  forwardRanges,
  isRelevant,
  sortEvents,
  type ActivityEvent,
} from "@/lib/activity";
import { chain, tapAddress, tapDeployBlock } from "@/lib/config";
import { tapAbi } from "@/lib/tap-abi";

/** How many relevant events one "page" of history aims for, and how far it may scan to find them. */
const PAGE_EVENTS = 25;
const PAGE_CHUNKS = 24; // 24 x 5,000 blocks, about 16 hours of Arc blocks
const PARALLEL = 4;
const POLL_MS = 2_000;

type Client = NonNullable<ReturnType<typeof usePublicClient>>;

/** Fetch all Tap events in [from, to], splitting the range if the node refuses it (too many results). */
async function fetchRange(client: Client, from: bigint, to: bigint): Promise<ActivityEvent[]> {
  try {
    const logs = await client.getContractEvents({
      address: tapAddress as Address,
      abi: tapAbi,
      fromBlock: from,
      toBlock: to,
    });
    return logs.map((log) => ({
      key: `${log.blockNumber}-${log.logIndex}`,
      name: log.eventName as ActivityEvent["name"],
      args: log.args as Record<string, unknown>,
      blockNumber: log.blockNumber,
      logIndex: log.logIndex,
      transactionHash: log.transactionHash,
    }));
  } catch (error) {
    if (to <= from) throw error;
    const mid = from + (to - from) / 2n;
    const [older, newer] = await Promise.all([fetchRange(client, from, mid), fetchRange(client, mid + 1n, to)]);
    return [...older, ...newer];
  }
}

/**
 * Recent Tap events, newest first: history is loaded backwards in 5,000-block chunks,
 * then new blocks are polled. Filtering to the viewer happens at render time so a
 * newly created allowance's older events show up without refetching.
 */
export function useActivity(account: Address | undefined, myIds: Set<string>) {
  const client = usePublicClient({ chainId: chain.id });
  const [events, setEvents] = useState<Map<string, ActivityEvent>>(new Map());
  const [timestamps, setTimestamps] = useState<Map<bigint, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [hasMore, setHasMore] = useState(true);

  const oldest = useRef<bigint | null>(null); // lowest block scanned so far
  const newest = useRef<bigint | null>(null); // highest block scanned so far
  const busy = useRef(false);
  const relevance = useRef({ account, myIds });
  useEffect(() => {
    relevance.current = { account, myIds };
  }, [account, myIds]);

  const add = useCallback((found: ActivityEvent[]) => {
    if (found.length === 0) return;
    setEvents((prev) => {
      const next = new Map(prev);
      for (const e of found) next.set(e.key, e);
      return next;
    });
  }, []);

  const loadOlder = useCallback(async () => {
    if (!client || busy.current) return;
    busy.current = true;
    setLoading(true);
    setError(null);
    try {
      if (newest.current === null) {
        const head = await client.getBlockNumber();
        newest.current = head;
        oldest.current = head + 1n;
      }
      let found = 0;
      let chunks = 0;
      while (found < PAGE_EVENTS && chunks < PAGE_CHUNKS && oldest.current! > tapDeployBlock) {
        const ranges = backwardRanges(oldest.current! - 1n, tapDeployBlock, PARALLEL);
        const results = await Promise.all(ranges.map((r) => fetchRange(client, r.from, r.to)));
        const batch = results.flat();
        add(batch);
        const { account: acct, myIds: ids } = relevance.current;
        found += batch.filter((e) => isRelevant(e, acct, ids)).length;
        chunks += ranges.length;
        oldest.current = ranges[ranges.length - 1].from;
      }
      setHasMore(oldest.current! > tapDeployBlock);
    } catch (e) {
      setError(e);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }, [client, add]);

  // Initial history.
  useEffect(() => {
    loadOlder();
  }, [loadOlder]);

  // Poll for new events.
  useEffect(() => {
    if (!client) return;
    let stopped = false;
    const timer = setInterval(async () => {
      if (newest.current === null || stopped) return;
      try {
        const head = await client.getBlockNumber();
        if (head <= newest.current) return;
        for (const r of forwardRanges(newest.current + 1n, head)) {
          add(await fetchRange(client, r.from, r.to));
          newest.current = r.to;
        }
      } catch {
        // Try again on the next tick.
      }
    }, POLL_MS);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [client, add]);

  const visible = useMemo(
    () => sortEvents([...events.values()].filter((e) => isRelevant(e, account, myIds))),
    [events, account, myIds],
  );

  // Block timestamps for what's on screen (Arc timestamps have 1-second precision).
  useEffect(() => {
    if (!client) return;
    const missing = [...new Set(visible.map((e) => e.blockNumber))].filter((b) => !timestamps.has(b));
    if (missing.length === 0) return;
    let cancelled = false;
    Promise.all(missing.slice(0, 50).map((b) => client.getBlock({ blockNumber: b }).catch(() => null))).then(
      (blocks) => {
        if (cancelled) return;
        setTimestamps((prev) => {
          const next = new Map(prev);
          for (const block of blocks) if (block) next.set(block.number, Number(block.timestamp));
          return next;
        });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [client, visible, timestamps]);

  return { events: visible, timestamps, loading, error, hasMore, loadOlder };
}
