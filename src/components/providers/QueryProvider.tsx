"use client";

import { ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

interface Props {
  children: ReactNode;
}

export function QueryProvider({ children }: Props) {
  // Create QueryClient once per app lifecycle
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 min default
            gcTime: 30 * 60 * 1000, // 30 min cache GC
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

