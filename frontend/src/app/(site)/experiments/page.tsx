import type { Metadata } from "next";
import { ExperimentsSection } from "@/components/home/experimentsSection";

export const metadata: Metadata = {
  title: "实验观测台 — Crescent Lab",
  description: "来自受控失败、未完成工具和技术问题的观测记录。",
};

export default function ExperimentsPage() {
  return <ExperimentsSection />;
}
