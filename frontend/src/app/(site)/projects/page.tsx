import type { Metadata } from "next";
import { LabProjects } from "@/components/home/labProjects";
import { loadJournal } from "@/lib/journal";
export const metadata: Metadata = { title: "项目 — Crescent Index", description: "用月相记录研究、构建、上线与收尾。" };
export default async function ProjectsPage() { return <LabProjects data={await loadJournal()} />; }
