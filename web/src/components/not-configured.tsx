import { SettingsIcon } from "lucide-react";

import { chain } from "@/lib/config";

export function NotConfigured() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-muted">
        <SettingsIcon className="size-6 text-muted-foreground" />
      </div>
      <h1 className="text-xl font-semibold">Contract not configured</h1>
      <p className="text-sm text-muted-foreground">
        This deployment doesn&apos;t know where the Tap contract lives on {chain.name}. Set{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">NEXT_PUBLIC_TAP_ADDRESS</code> to the
        deployed contract address and rebuild.
      </p>
    </div>
  );
}
