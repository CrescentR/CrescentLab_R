import type { Metadata } from "next";
import { NotesExperience } from "@/components/notes/notesExperience";
import { loadJournal } from "@/lib/journal";
export const metadata: Metadata = { title: "笔记 — Crescent Index", description: "长文与札记，按月份串起一个想法的生长过程。" };
export default async function NotesPage({ searchParams }: { searchParams: Promise<{ q?: string; kind?: string; collection?: string; entry?: string }> }) {
  const [data, params] = await Promise.all([loadJournal(), searchParams]);
  return <NotesExperience key={`${params.q || ""}:${params.kind || ""}:${params.collection || ""}:${params.entry || ""}`} data={data} initialQuery={params.q} initialKind={params.kind === "short" ? "short" : "all"} initialCollection={params.collection} initialEntry={params.entry} />;
}
