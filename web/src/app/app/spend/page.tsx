"use client";

import { InboxIcon } from "lucide-react";
import { useAccount } from "wagmi";

import { RequireWallet } from "@/components/connect-prompt";
import { SpenderAllowance } from "@/components/spend/spender-allowance";
import { EmptyState, ErrorNote, Loading } from "@/components/status";
import { useNow } from "@/hooks/use-now";
import { useMyAllowances } from "@/hooks/use-tap";
import { allowanceStatus } from "@/lib/allowance";
import { describeError } from "@/lib/errors";

export default function SpendPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Spend</h1>
        <p className="text-sm text-muted-foreground">Allowances others have given you. Send USDC to anyone within your limits.</p>
      </div>
      <RequireWallet
        title="Connect to see your allowances"
        description="If someone gave your address an allowance, connect that wallet to spend from it."
      >
        <GrantedAllowances />
      </RequireWallet>
    </div>
  );
}

function GrantedAllowances() {
  const { address } = useAccount();
  const now = useNow();
  const { allowances, vaultBalances, isLoading, error } = useMyAllowances("spender", address);

  if (error) return <ErrorNote>{describeError(error)}</ErrorNote>;
  if (isLoading || !allowances) return <Loading />;

  if (allowances.length === 0) {
    return (
      <EmptyState icon={<InboxIcon className="size-5" />} title="No allowances for this wallet">
        When someone gives your address an allowance, it shows up here. Ask them for a share link, or check that
        you&apos;re connected with the right wallet.
      </EmptyState>
    );
  }

  const rank = (s: string) => (s === "active" ? 0 : s === "paused" || s === "scheduled" ? 1 : 2);
  const sorted = [...allowances].sort((x, y) => rank(allowanceStatus(x, now)) - rank(allowanceStatus(y, now)));

  return (
    <div className="grid gap-3 animate-in fade-in-0">
      {sorted.map((a) => (
        <SpenderAllowance key={a.id.toString()} allowance={a} vaultBalance={vaultBalances.get(a.owner) ?? 0n} now={now} />
      ))}
    </div>
  );
}
