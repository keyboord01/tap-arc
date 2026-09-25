"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatUnits } from "viem";
import { cn } from "@/lib/utils";

type Props = Omit<React.ComponentProps<"input">, "onChange" | "value" | "max"> & {
  value: string;
  onValueChange: (value: string) => void;
  /** Adds a "Max" button that fills in this 6-decimal amount. */
  max?: bigint;
};

/** A USDC amount field that only accepts up to 6 decimals. */
export function AmountInput({ value, onValueChange, max, className, ...props }: Props) {
  return (
    <div className="relative">
      <Input
        inputMode="decimal"
        autoComplete="off"
        placeholder="0.00"
        value={value}
        onChange={(e) => {
          const next = e.target.value.replace(/,/g, ".");
          if (/^\d*(\.\d{0,6})?$/.test(next)) onValueChange(next);
        }}
        className={cn("h-11 pr-28 text-lg tabular-nums", className)}
        {...props}
      />
      <div className="absolute inset-y-0 right-2 flex items-center gap-1">
        {max !== undefined && max > 0n && (
          <Button type="button" variant="ghost" size="sm" onClick={() => onValueChange(formatUnits(max, 6))}>
            Max
          </Button>
        )}
        <span className="pr-1 text-sm text-muted-foreground">USDC</span>
      </div>
    </div>
  );
}
