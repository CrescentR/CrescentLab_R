"use client";

import gsap from "gsap";
import { useEffect, useMemo, useRef } from "react";
import { ActivitySection } from "@/components/home/activitySection";
import { AnnouncementBar } from "@/components/home/announcementBar";
import { ArticleSection } from "@/components/home/articleSection";
import { ContentObjectsPanel } from "@/components/home/contentObjectsPanel";
import { HeroSection } from "@/components/home/heroSection";
import { HomeHeader } from "@/components/home/homeHeader";
import { ProjectSection } from "@/components/home/projectSection";
import { personas } from "@/lib/personas";
import { useUiStore } from "@/store/uiStore";
import type { HomeContent } from "@/types/home";

export function HomeClient({ content }: { content: HomeContent }) {
  const rootRef = useRef<HTMLElement>(null);
  const activePersona = useUiStore((state) => state.activePersona);
  const loginPanelOpen = useUiStore((state) => state.loginPanelOpen);
  const setActivePersona = useUiStore((state) => state.setActivePersona);
  const setLoginPanelOpen = useUiStore((state) => state.setLoginPanelOpen);
  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  const persona = personas[activePersona];
  const personaOptions = useMemo(() => [personas.member, personas.admin], []);

  useEffect(() => {
    if (!rootRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.from("[data-lab-animate]", {
        autoAlpha: 0,
        duration: 0.42,
        ease: "power3.out",
        stagger: 0.025,
        y: 10,
      });
    }, rootRef);

    return () => ctx.revert();
  }, [activePersona]);

  return (
    <main ref={rootRef} className="home-page min-h-screen">
      <HomeHeader
        activePersona={activePersona}
        loginPanelOpen={loginPanelOpen}
        navItems={content.navItems}
        onSelectPersona={setActivePersona}
        onToggleLogin={() => setLoginPanelOpen(!loginPanelOpen)}
        onToggleTheme={toggleTheme}
        persona={persona}
        personaOptions={personaOptions}
        theme={theme}
      />
      <AnnouncementBar announcement={content.announcement} />
      <HeroSection categories={content.categories} feature={content.feature} hero={content.hero} />

      <section className="home-container grid gap-4 pb-14 lg:grid-cols-[minmax(0,1fr)_310px]">
        <ArticleSection articles={content.articles} />
        <ContentObjectsPanel modules={content.modules} />
      </section>

      <ProjectSection projects={content.projects} />
      <ActivitySection activities={content.activities} />
    </main>
  );
}
