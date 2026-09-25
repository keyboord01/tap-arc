"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { shortAddress } from "@/lib/format";
import { cn } from "@/lib/utils";

/** A shortened address; click to copy the full one. */
export function Address({ address, className }: { address: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
          className={cn(
            "inline-flex items-center gap-1.5 rounded font-mono text-sm transition-colors hover:text-foreground",
            className,
          )}
        >
          {shortAddress(address)}
          {copied ? <CheckIcon className="size-3.5 text-success" /> : <CopyIcon className="size-3.5 opacity-50" />}
        </button>
      </TooltipTrigger>
      <TooltipContent className="font-mono">{copied ? "Copied" : address}</TooltipContent>
    </Tooltip>
  );
}
