"use client";

import { usePathname } from "next/navigation";
import { CheckIcon, ChevronDownIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { network, networkSites } from "@/lib/config";

const labels = {
  mainnet: "Mainnet",
  testnet: "Testnet",
  local: "Local",
} as const;

/**
 * Shows which Arc network this deployment uses and links to the deployment for the other one.
 * Each network is its own build (NEXT_PUBLIC_CHAIN is read at build time), so switching opens the other site.
 */
export function NetworkSwitch() {
  const pathname = usePathname();
  const others = (["mainnet", "testnet"] as const).filter(
    (n) => n !== network && networkSites[n],
  );
  const variant = network === "mainnet" ? "default" : "warning";

  if (others.length === 0) {
    return network === "mainnet" ? null : (
      <Badge variant={variant}>{labels[network]}</Badge>
    );
  }

  // Allowance ids differ between networks, so a share page maps to the app home on the other network.
  const path = pathname.startsWith("/app/a/") ? "/app" : pathname;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Network: ${labels[network]}. Switch network`}
          className="rounded-md"
        >
          <Badge variant={variant} className="gap-1">
            {labels[network]}
            <ChevronDownIcon className="size-3" />
          </Badge>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        <DropdownMenuLabel className="font-normal text-muted-foreground">
          Arc network
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <CheckIcon /> {labels[network]}
        </DropdownMenuItem>
        {others.map((n) => (
          <DropdownMenuItem key={n} asChild>
            <a href={`${networkSites[n]}${path}`}>
              <span className="size-4" aria-hidden /> {labels[n]}
              {n === "testnet" && (
                <span className="ml-auto text-xs text-muted-foreground">
                  test USDC
                </span>
              )}
            </a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
