import type { Metadata } from "next";
import { AboutSection } from "@/components/home/aboutSection";

export const metadata: Metadata = {
  title: "关于 — Crescent Lab",
  description: "站点身份、记录原则，以及各内容区块的职责划分。",
};

export default function AboutPage() {
  return <AboutSection />;
}
