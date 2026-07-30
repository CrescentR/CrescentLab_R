import type { Metadata } from "next";
import { LabNotes } from "@/components/home/labNotes";

export const metadata: Metadata = {
  title: "笔记 — Crescent Lab",
  description: "已经整理成完整文章、能够独立阅读和长期引用的内容。",
};

export default function NotesPage() {
  return <LabNotes />;
}
