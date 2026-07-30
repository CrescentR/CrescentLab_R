import type { Metadata } from "next";
import { NowBuildingSection } from "@/components/home/nowBuildingSection";

export const metadata: Metadata = {
  title: "正在构建 — Crescent Lab",
  description: "当前真实投入时间、短期内会继续更新的构建。",
};

export default function BuildingPage() {
  return <NowBuildingSection />;
}
