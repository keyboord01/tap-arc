"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { WagmiProvider } from "wagmi";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { wagmiConfig } from "@/lib/wagmi";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 2_000, refetchOnWindowFocus: true } } }),
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            {children}
            <Toaster position="bottom-right" closeButton mobileOffset={{ bottom: 80 }} />
          </TooltipProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  );
}
