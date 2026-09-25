"use client";

import type { ReactNode } from "react";
import { CalendarIcon, ClockIcon } from "lucide-react";

import { Address } from "@/components/address";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  allowanceStatus,
  currentPeriod,
  lastUsableSecond,
  remainingNow,
  statusLabel,
  type Allowance,
  type AllowanceStatus,
} from "@/lib/allowance";
import { formatDate, formatDuration, formatUsdc, periodLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

const badgeVariant: Record<AllowanceStatus, "success" | "warning" | "secondary" | "destructive"> = {
  active: "success",
  paused: "warning",
  scheduled: "secondary",
  expired: "secondary",
  revoked: "destructive",
};

export function StatusBadge({ status }: { status: AllowanceStatus }) {
  return <Badge variant={badgeVariant[status]}>{statusLabel[status]}</Badge>;
}

/**
 * One allowance: who it's for, its rule, a remaining-this-period bar and a
 * countdown to the next reset. `now` is passed in so a list shares one clock.
 */
export function AllowanceCard({
  allowance: a,
  now,
  counterpartyLabel,
  counterparty,
  actions,
  footer,
}: {
  allowance: Allowance;
  now: number;
  counterpartyLabel: string;
  counterparty: string;
  actions?: ReactNode;
  footer?: ReactNode;
}) {
  const status = allowanceStatus(a, now);
  const period = currentPeriod(a, now);
  const remaining = remainingNow(a, now);
  const pct = a.amountPerPeriod === 0n ? 0 : Number((remaining * 10_000n) / a.amountPerPeriod) / 100;
  const inactive = status === "revoked" || status === "expired";
  const lastDay = lastUsableSecond(a);

  return (
    <Card className={cn("gap-4 py-5 transition-opacity", inactive && "opacity-60")}>
      <div className="flex items-start justify-between gap-3 px-5">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{counterpartyLabel}</span>
            <Address address={counterparty} className="text-foreground" />
          </div>
          <p className="text-lg font-semibold tracking-tight">
            {formatUsdc(a.amountPerPeriod)} USDC{" "}
            <span className="whitespace-nowrap font-normal text-muted-foreground">{periodLabel(Number(a.periodLength))}</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <StatusBadge status={status} />
          {actions}
        </div>
      </div>

      {!inactive && (
        <div className="space-y-2 px-5">
          <Progress
            value={pct}
            aria-label="Remaining this period"
            indicatorClassName={status === "active" ? undefined : "bg-muted-foreground"}
          />
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm">
            <span>
              <span className="font-medium tabular-nums">{formatUsdc(remaining)}</span>{" "}
              <span className="text-muted-foreground">of {formatUsdc(a.amountPerPeriod)} left this period</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <ClockIcon className="size-3.5" />
              {status === "scheduled"
                ? `starts in ${formatDuration(Number(a.start) - now)}`
                : `resets in ${formatDuration(period.end - now)}`}
            </span>
          </div>
        </div>
      )}

      {(lastDay !== undefined || footer) && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 text-sm text-muted-foreground">
          {lastDay !== undefined ? (
            <span className="inline-flex items-center gap-1.5">
              <CalendarIcon className="size-3.5" />
              {status === "expired" ? "Ended" : "Until"} {formatDate(lastDay)}
            </span>
          ) : (
            <span />
          )}
          {footer}
        </div>
      )}
    </Card>
  );
}
