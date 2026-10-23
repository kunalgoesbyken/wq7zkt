"use client";

import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";
import { SWRConfig } from "swr";
import { TooltipProvider } from "@/components/ui/tooltip";

const swrConfig = {
  revalidateOnFocus: false,
  keepPreviousData: true,
};

export function Providers({ children }: { children: ReactNode }) {
  return (
    <NuqsAdapter>
      <SWRConfig value={swrConfig}>
        <TooltipProvider delayDuration={150}>{children}</TooltipProvider>
      </SWRConfig>
    </NuqsAdapter>
  );
}
