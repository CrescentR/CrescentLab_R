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
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("crescentlab-theme") as ThemeMode | null;

    if (savedTheme === "dark" || savedTheme === "light") {
      setTheme(savedTheme);
    }

  }, [setTheme]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("crescentlab-theme", theme);
  }, [theme]);

  return null;
}
