"use client";

import { useMemo, useState } from "react";
import { PlusIcon, UsersIcon } from "lucide-react";
import { useAccount } from "wagmi";

import { AllowanceCard } from "@/components/allowance-card";
import { RequireWallet } from "@/components/connect-prompt";
import { Landing } from "@/components/landing";
import { EmptyState, ErrorNote, Loading } from "@/components/status";
import { Button } from "@/components/ui/button";
import { AllowanceFormDialog } from "@/components/vault/allowance-form-dialog";
import { OwnerActions } from "@/components/vault/owner-actions";
import { VaultSummary } from "@/components/vault/vault-summary";
import { useNow } from "@/hooks/use-now";
import { useMyAllowances, useVault } from "@/hooks/use-tap";
import { allowanceStatus, isLive } from "@/lib/allowance";
import { describeError } from "@/lib/errors";

export default function VaultPage() {
  const { status } = useAccount();
  if (status === "disconnected") return <Landing />;
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">My vault</h1>
        <p className="text-sm text-muted-foreground">
          Lock USDC in your vault and let others spend it within limits you set.
        </p>
      </div>
      <RequireWallet
        title="Connect to open your vault"
        description="Give family, freelancers or AI agents their own USDC allowance, like 20 USDC every 7 days, enforced by the contract."
      >
        <Vault />
      </RequireWallet>
    </div>
  );
}

function Vault() {
  const { address } = useAccount();
  const now = useNow();
  const vault = useVault(address);
  const { allowances, isLoading, error } = useMyAllowances("owner", address);
  const [creating, setCreating] = useState(false);
  const [showEnded, setShowEnded] = useState(false);

  const { live, ended, promised } = useMemo(() => {
    const isEnded = (status: string) => status === "revoked" || status === "expired";
    const live = allowances?.filter((a) => !isEnded(allowanceStatus(a, now))) ?? [];
    const ended = allowances?.filter((a) => isEnded(allowanceStatus(a, now))) ?? [];
    const promised = (allowances ?? [])
      .filter((a) => isLive(a, now))
      .reduce((sum, a) => sum + a.amountPerPeriod, 0n);
    return { live, ended, promised };
  }, [allowances, now]);

  if (vault.error || error) return <ErrorNote>{describeError(vault.error ?? error)}</ErrorNote>;
  if (vault.vaultBalance === undefined || isLoading || !allowances) return <Loading />;

  return (
    <div className="space-y-8 animate-in fade-in-0">
      <VaultSummary
        vaultBalance={vault.vaultBalance}
        walletBalance={vault.walletBalance ?? 0n}
        approved={vault.approved ?? 0n}
        promised={promised}
        liveCount={allowances.filter((a) => isLive(a, now)).length}
      />

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Allowances</h2>
          {allowances.length > 0 && (
            <Button size="sm" onClick={() => setCreating(true)}>
              <PlusIcon /> New allowance
            </Button>
          )}
        </div>

        {allowances.length === 0 ? (
          <EmptyState
            icon={<UsersIcon className="size-5" />}
            title="No allowances yet"
            action={
              <Button onClick={() => setCreating(true)}>
                <PlusIcon /> New allowance
              </Button>
            }
          >
            Create one to let someone spend from your vault, for example 20 USDC every 7 days.
          </EmptyState>
        ) : (
          <div className="grid gap-3">
            {live.map((a) => (
              <AllowanceCard
                key={a.id.toString()}
                allowance={a}
                now={now}
                counterpartyLabel="Spender"
                counterparty={a.spender}
                actions={<OwnerActions allowance={a} now={now} />}
              />
            ))}
            {live.length === 0 && (
              <p className="text-sm text-muted-foreground">No live allowances. Ended ones are listed below.</p>
            )}
          </div>
        )}

        {ended.length > 0 && (
          <div className="space-y-3">
            <Button variant="link" className="px-0 text-muted-foreground" onClick={() => setShowEnded((v) => !v)}>
              {showEnded ? "Hide" : "Show"} {ended.length} ended allowance{ended.length === 1 ? "" : "s"}
            </Button>
            {showEnded && (
              <div className="grid gap-3 animate-in fade-in-0">
                {ended.map((a) => (
                  <AllowanceCard
                    key={a.id.toString()}
                    allowance={a}
                    now={now}
                    counterpartyLabel="Spender"
                    counterparty={a.spender}
                    actions={<OwnerActions allowance={a} now={now} />}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {creating && <AllowanceFormDialog open onOpenChange={setCreating} now={now} />}
    </div>
  );
}
