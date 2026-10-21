"use client";

import { useEffect, useState } from "react";
import { listAdminProjects, type ProjectListItem } from "@/lib/api/projects";

export function ProjectAssociationField({ value, onChange }: { value: number | null; onChange: (id: number | null) => void }) {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void (async () => {
      const first = await listAdminProjects({ page: 1, page_size: 50 });
      const items = [...first.items];
      for (let page = 2; page <= first.total_pages; page += 1) {
        const result = await listAdminProjects({ page, page_size: 50 });
        items.push(...result.items);
      }
      return items;
    })().then((items) => {
      if (active) setProjects(items);
    }).catch(() => { if (active) setError("关联项目加载失败，请刷新后重试。"); });
    return () => { active = false; };
  }, []);
  return <label className="flex flex-col gap-2 text-sm"><span>关联项目</span><select className="field-surface rounded-[var(--radius)] p-3" value={value ?? ""} disabled={Boolean(error)} onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}><option value="">不关联项目</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select>{error && <span role="alert">{error}</span>}</label>;
}
