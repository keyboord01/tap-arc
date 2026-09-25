"use client";

import { useState } from "react";

import { shortAddress } from "@/lib/format";

/** Shortened contract address linking to the explorer, with a copy button. */
export function ContractAddress({ address, href }: { address: string; href?: string }) {
  const [copied, setCopied] = useState(false);
  const short = shortAddress(address);

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      {href ? (
        <a href={href} className="font-mono text-mint underline-offset-4 hover:text-paper hover:underline" title={address}>
          {short}
        </a>
      ) : (
        <span className="font-mono text-mint" title={address}>
          {short}
        </span>
      )}
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(address);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="rounded-md border border-line px-2 py-0.5 text-[13px] font-semibold text-fog transition-colors hover:border-mint hover:text-paper"
        aria-label={copied ? "Address copied" : "Copy contract address"}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </span>
  );
}
