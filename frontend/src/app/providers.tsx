"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useEffect, useState } from "react";
import { PersonaRole, ThemeMode, useUiStore } from "@/store/ui-store";
import { siteBranding } from "@/lib/site-settings";

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
      <PrototypeStateSync />
      {children}
    </QueryClientProvider>
  );
}

function PrototypeStateSync() {
  const theme = useUiStore((state) => state.theme);
  const activePersona = useUiStore((state) => state.activePersona);
  const setTheme = useUiStore((state) => state.setTheme);
  const setActivePersona = useUiStore((state) => state.setActivePersona);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("crescentlab-theme") as ThemeMode | null;
    const savedPersona = window.localStorage.getItem("crescentlab-persona") as PersonaRole | null;

    if (savedTheme === "dark" || savedTheme === "light") {
      setTheme(savedTheme);
    }

    if (savedPersona === "guest" || savedPersona === "member" || savedPersona === "admin") {
      setActivePersona(savedPersona);
    }
  }, [setActivePersona, setTheme]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("crescentlab-theme", theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem("crescentlab-persona", activePersona);
  }, [activePersona]);

  useEffect(() => {
    const selector = 'link[rel="icon"][data-site-setting-key="faviconUrl"]';
    let iconLink = document.head.querySelector<HTMLLinkElement>(selector);

    if (!iconLink) {
      iconLink = document.createElement("link");
      iconLink.rel = "icon";
      iconLink.dataset.siteSettingKey = "faviconUrl";
      document.head.appendChild(iconLink);
    }

    iconLink.href = siteBranding.faviconUrl;
  }, []);

  return null;
}
