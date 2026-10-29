"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { assignAdminBuild, deleteAdminBuild, listAdminBuilds, type BuildItem } from "@/lib/api/builds";
import type { ProjectListItem } from "@/lib/api/projects";

// 旧的进展记录可能没有关联项目；归属后它们只能在对应项目的「过程」里编辑。
export function UnassignedProgress({ projects }: { projects: ProjectListItem[] }) {
  const { push } = useToast();
  const [items, setItems] = useState<BuildItem[]>([]);

  useEffect(() => {
    let active = true;
    listAdminBuilds({ unassigned: true, page_size: 50 })
      .then((result) => { if (active) setItems(result.items); })
      .catch(() => { if (active) push("未归属进展加载失败", "error"); });
    return () => { active = false; };
  }, [push]);

  async function assign(item: BuildItem, projectId: number) {
    try {
      await assignAdminBuild(item.id, projectId);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      push(`「${item.name}」已归入${projects.find((project) => project.id === projectId)?.name ?? "项目"}`, "success");
    } catch (err) {
      push(err && typeof err === "object" && "message" in err ? String(err.message) : "归属失败", "error");
    }
  }

  async function remove(item: BuildItem) {
    if (!confirm(`删除进展「${item.name}」？`)) return;
    try {
      await deleteAdminBuild(item.id);
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      push("进展已删除", "success");
    } catch {
      push("删除进展失败", "error");
    }
  }

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="unassigned-progress-heading" className="project-cms-phase-group project-cms-unassigned">
      <h2 id="unassigned-progress-heading">未归属的进展<small>旧记录，需指定项目</small><span>{items.length}</span></h2>
      <p>这些进展是在「进展归入项目」之前创建的。指定项目后，就能在该项目的「过程」里编辑。</p>
      <ul>
        {items.map((item) => (
          <li className="project-cms-row" key={item.id}>
            <div className="project-cms-row-main">
              <span className="project-cms-row-title"><strong>{item.name}</strong>{item.status !== "published" && <Badge tone="amber">草稿</Badge>}</span>
              <span className="project-cms-row-now">{item.latest_progress || item.one_liner || item.next_step || "没有内容"}</span>
            </div>
            <select aria-label={`为「${item.name}」指定项目`} className="field-surface project-cms-assign" defaultValue="" onChange={(event) => { if (event.target.value) void assign(item, Number(event.target.value)); }}>
              <option disabled value="">归入项目…</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
            <div className="project-cms-row-actions">
              <button aria-label={`删除进展 ${item.name}`} className="is-danger" onClick={() => remove(item)} type="button"><Trash2 size={14} /></button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
