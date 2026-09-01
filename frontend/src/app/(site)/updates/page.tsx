import type { Metadata } from "next";
import { ExperimentsSection } from "@/components/home/experimentsSection";
import { NowBuildingSection } from "@/components/home/nowBuildingSection";

export const metadata: Metadata = {
  title: "动态 — Crescent Index",
  description: "近期进展与过程中形成的阶段记录。",
};

export default function UpdatesPage() {
  return (
    <>
      <NowBuildingSection />
      <ExperimentsSection />
    </>
  );
}
