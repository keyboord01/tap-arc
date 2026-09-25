import { CalendarClockIcon, LinkIcon, UsersIcon, ZapIcon } from "lucide-react";

import { ConnectButton } from "@/components/connect-button";

const features = [
  {
    icon: UsersIcon,
    title: "Many spenders, one vault",
    body: "Give family, a freelancer and your AI agents each their own allowance from the same USDC vault.",
  },
  {
    icon: CalendarClockIcon,
    title: "Budgets that reset",
    body: "Limits like 20 USDC every 7 days or 300 USDC every 30 days, with an optional end date. Pause or revoke any time.",
  },
  {
    icon: LinkIcon,
    title: "A link for each spender",
    body: "Share one link. Spenders see what's left, when it resets, and can send USDC to anyone within their limit.",
  },
  {
    icon: ZapIcon,
    title: "Final in under a second",
    body: "Arc blocks are final on inclusion, and gas is paid in USDC. Every transaction shows how long it took to finalize.",
  },
];

const steps = [
  ["Deposit", "Move USDC into your vault. It stays yours: withdraw any time."],
  ["Grant", "Pick a spender, a limit and how often it resets."],
  ["Share", "Send them the link. The contract enforces the rules."],
];

export function Landing() {
  return (
    <div className="space-y-16 py-6 animate-in fade-in-0 sm:py-12">
      <section className="mx-auto max-w-2xl space-y-6 text-center">
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Spending allowances for USDC, enforced onchain
        </h1>
        <p className="text-balance text-lg text-muted-foreground">
          Lock USDC in a vault and let others spend it with rules you set, like &ldquo;up to 20 USDC every 7 days,
          until December 31.&rdquo; For family, freelancers and AI agents.
        </p>
        <div className="flex justify-center">
          <ConnectButton />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {features.map(({ icon: Icon, title, body }) => (
          <div key={title} className="space-y-2 rounded-xl border bg-card p-5">
            <div className="grid size-9 place-items-center rounded-lg bg-primary/15 text-primary">
              <Icon className="size-4" />
            </div>
            <h2 className="font-medium">{title}</h2>
            <p className="text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>

      <section className="space-y-6">
        <h2 className="text-center text-xl font-semibold">How it works</h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {steps.map(([title, body], i) => (
            <li key={title} className="flex gap-3 sm:flex-col">
              <span className="grid size-8 shrink-0 place-items-center rounded-full border font-mono text-sm">
                {i + 1}
              </span>
              <div className="space-y-1">
                <p className="font-medium">{title}</p>
                <p className="text-sm text-muted-foreground">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
