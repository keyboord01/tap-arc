"use client";

import { useMemo } from "react";
import { useAccount } from "wagmi";

import { ActivityFeed } from "@/components/activity/activity-feed";
import { useAllowanceIds } from "@/hooks/use-tap";

export default function ActivityPage() {
  const { address, status } = useAccount();
  const owned = useAllowanceIds("owner", address);
  const granted = useAllowanceIds("spender", address);
  const myIds = useMemo(
    () => new Set([...(owned.data ?? []), ...(granted.data ?? [])].map(String)),
    [owned.data, granted.data],
  );

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
        <p className="text-sm text-muted-foreground">
          {address
            ? "Everything involving your wallet: deposits, allowances and spends. Updates live."
            : "Recent activity on the Tap contract. Connect a wallet to see only yours."}
        </p>
      </div>
      {status !== "reconnecting" && status !== "connecting" && <ActivityFeed account={address} myIds={myIds} />}
    </div>
  );
}
