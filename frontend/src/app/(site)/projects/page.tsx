import type { Metadata } from "next";
import { LabProjects } from "@/components/home/labProjects";

export const metadata: Metadata = {
  title: "项目 — Crescent Lab",
  description: "已经形成稳定名称、明确用途和可维护边界的成果。",
};

export default function ProjectsPage() {
  return <LabProjects />;
}
