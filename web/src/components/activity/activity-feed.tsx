"use client";

import {
  ArrowDownToLineIcon,
  ArrowUpFromLineIcon,
  BanIcon,
  ExternalLinkIcon,
  HistoryIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  SendIcon,
  type LucideIcon,
} from "lucide-react";
import type { Address } from "viem";

import { EmptyState, ErrorNote, Loading } from "@/components/status";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useActivity } from "@/hooks/use-activity";
import { useNow } from "@/hooks/use-now";
import { describeEvent, timeAgo, type ActivityEvent } from "@/lib/activity";
import { txUrl } from "@/lib/config";
import { describeError } from "@/lib/errors";

const icons: Record<ActivityEvent["name"], LucideIcon> = {
  Deposited: ArrowDownToLineIcon,
  Withdrawn: ArrowUpFromLineIcon,
  AllowanceCreated: PlusIcon,
  AllowanceEdited: PencilIcon,
  AllowancePaused: PauseIcon,
  AllowanceUnpaused: PlayIcon,
  AllowanceRevoked: BanIcon,
  Spent: SendIcon,
};

export function ActivityFeed({ account, myIds }: { account?: Address; myIds: Set<string> }) {
  const { events, timestamps, loading, error, hasMore, loadOlder } = useActivity(account, myIds);
  const now = useNow(5_000);

  if (error && events.length === 0) return <ErrorNote>{describeError(error)}</ErrorNote>;
  if (loading && events.length === 0) return <Loading label="Loading recent activity…" />;

  return (
    <div className="space-y-4">
      {events.length === 0 ? (
        <EmptyState icon={<HistoryIcon className="size-5" />} title="No recent activity">
          {account
            ? "Deposits, allowances and spends involving your wallet will appear here as they happen."
            : "Activity on the Tap contract will appear here as it happens."}
        </EmptyState>
      ) : (
        <Card className="gap-0 py-0">
          <ul className="divide-y">
            {events.map((e) => {
              const Icon = icons[e.name];
              const ts = timestamps.get(e.blockNumber);
              const url = txUrl(e.transactionHash);
              return (
                <li key={e.key} className="flex items-center gap-3 px-4 py-3 animate-in fade-in-0">
                  <div className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{describeEvent(e, account)}</p>
                    <p className="text-xs text-muted-foreground">
                      {ts !== undefined ? timeAgo(ts, now) : "…"} · block {e.blockNumber.toString()}
                    </p>
                  </div>
                  {url && (
                    <Button asChild variant="ghost" size="icon-sm" aria-label="View transaction">
                      <a href={url} target="_blank" rel="noreferrer">
                        <ExternalLinkIcon />
                      </a>
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}
      {error !== null && events.length > 0 && <ErrorNote>{describeError(error)}</ErrorNote>}
      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={loadOlder} disabled={loading}>
            {loading ? "Loading…" : "Load older activity"}
          </Button>
        </div>
      )}
    </div>
  );
}
