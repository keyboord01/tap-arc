"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Loader2Icon } from "lucide-react";

import { cn } from "@/lib/utils";

/** A quiet spinner that only appears if loading takes longer than a moment. */
export function Loading({ label = "Loading…", className }: { label?: string; className?: string }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 250);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground transition-opacity duration-300",
        visible ? "opacity-100" : "opacity-0",
        className,
      )}
    >
      <Loader2Icon className="size-4 animate-spin" />
      {label}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center animate-in fade-in-0">
      <div className="grid size-11 place-items-center rounded-full bg-muted text-muted-foreground">{icon}</div>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {children && <p className="mx-auto max-w-sm text-sm text-muted-foreground">{children}</p>}
      </div>
      {action}
    </div>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {children}
    </p>
  );
}
