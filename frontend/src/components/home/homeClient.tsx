"use client";

import { MotionConfig } from "motion/react";
import { useEffect } from "react";
import Lenis from "lenis";
import { LabFooter } from "@/components/home/labFooter";
import { LabHeader } from "@/components/home/labHeader";
import { LabHero } from "@/components/home/labHero";
import { LabNotes } from "@/components/home/labNotes";
import { LabProjects } from "@/components/home/labProjects";
import { ExperimentsSection } from "@/components/home/experimentsSection";
import { NowBuildingSection } from "@/components/home/nowBuildingSection";

export function HomeClient() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce), (pointer: coarse)").matches) return;

    const lenis = new Lenis({
      anchors: true,
      duration: 1.05,
      smoothWheel: true,
      wheelMultiplier: 0.9,
    });
    let frame = 0;
    const update = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <main className="lab-home">
        <LabHeader />
        <LabHero />
        <NowBuildingSection />
        <ExperimentsSection />
        <LabProjects />
        <LabNotes />
        <LabFooter />
      </main>
    </MotionConfig>
  );
}
