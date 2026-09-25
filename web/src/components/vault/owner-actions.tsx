"use client";

import { useState } from "react";
import { BanIcon, EllipsisVerticalIcon, LinkIcon, PauseIcon, PencilIcon, PlayIcon } from "lucide-react";
import { toast } from "sonner";
import type { Address } from "viem";

import { AllowanceFormDialog } from "@/components/vault/allowance-form-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { txStep, useTx } from "@/hooks/use-tx";
import type { Allowance } from "@/lib/allowance";
import { tapAddress } from "@/lib/config";
import { shortAddress } from "@/lib/format";
import { shareUrl } from "@/lib/share";
import { tapAbi } from "@/lib/tap-abi";

export function OwnerActions({ allowance: a, now }: { allowance: Allowance; now: number }) {
  const { run, busy } = useTx();
  const [editing, setEditing] = useState(false);
  const [revoking, setRevoking] = useState(false);

  if (a.revoked) return null;

  const call = (functionName: "pause" | "unpause" | "revoke", title: string) =>
    run([txStep(title, { address: tapAddress as Address, abi: tapAbi, functionName, args: [a.id] })]);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="Allowance actions">
            <EllipsisVerticalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onSelect={() => {
              navigator.clipboard.writeText(shareUrl(a.id));
              toast.success("Share link copied", {
                description: `Send it to ${shortAddress(a.spender)}. It opens their view of this allowance.`,
              });
            }}
          >
            <LinkIcon /> Copy share link
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setEditing(true)}>
            <PencilIcon /> Edit
          </DropdownMenuItem>
          {a.paused ? (
            <DropdownMenuItem disabled={busy} onSelect={() => call("unpause", "Resume allowance")}>
              <PlayIcon /> Resume
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem disabled={busy} onSelect={() => call("pause", "Pause allowance")}>
              <PauseIcon /> Pause
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" disabled={busy} onSelect={() => setRevoking(true)}>
            <BanIcon /> Revoke
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {editing && <AllowanceFormDialog open onOpenChange={setEditing} allowance={a} now={now} />}

      <Dialog open={revoking} onOpenChange={setRevoking}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Revoke this allowance?</DialogTitle>
            <DialogDescription>
              {shortAddress(a.spender)} will no longer be able to spend from your vault. This can&apos;t be undone; to
              give access again, create a new allowance. Your vault balance is not affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRevoking(false)}>
              Keep it
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={async () => {
                if (await call("revoke", "Revoke allowance")) setRevoking(false);
              }}
            >
              Revoke
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
