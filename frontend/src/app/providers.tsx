"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { ReactNode, useEffect, useState } from "react";
import { ThemeMode, useUiStore } from "@/store/uiStore";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <PrototypeStateSync />
        {children}
      </MotionConfig>
    </QueryClientProvider>
  );
}

function PrototypeStateSync() {
  const setTheme = useUiStore((state) => state.setTheme);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("crescentlab-theme") as ThemeMode | null;

    const initialTheme = savedTheme === "dark" ? "dark" : "light";
    setTheme(initialTheme);
    document.documentElement.dataset.theme = initialTheme;
    return useUiStore.subscribe((state, previous) => {
      if (state.theme === previous.theme) return;
      document.documentElement.dataset.theme = state.theme;
      window.localStorage.setItem("crescentlab-theme", state.theme);
    });
  }, [setTheme]);

  return null;
}
