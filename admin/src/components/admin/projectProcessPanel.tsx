"use client";

import { useEffect, useState } from "react";
import { BookOpen, Footprints, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { createAdminBuild, deleteAdminBuild, listAdminBuilds, updateAdminBuild, type BuildInput, type BuildItem } from "@/lib/api/builds";
import { getAdminProjectRelated, type ProjectRelated } from "@/lib/api/projects";

type ProgressForm = {
  id: number | null;
  name: string;
  latest_progress: string;
  next_step: string;
  date: string;
  status: "draft" | "published";
};

export function ProjectProcessPanel({ projectId }: { projectId: number }) {
  const { push } = useToast();
  const [progress, setProgress] = useState<BuildItem[]>([]);
  const [related, setRelated] = useState<ProjectRelated>({ articles: [], notes: [] });
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<ProgressForm | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([listAdminBuilds({ project_id: projectId, page_size: 50 }), getAdminProjectRelated(projectId)])
      .then(([builds, records]) => {
        if (!active) return;
        setProgress(sortByDate(builds.items));
        setRelated(records);
      })
      .catch((err) => { if (active) push(errorMessage(err, "加载项目过程失败"), "error"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [projectId, push]);

  function startNew() {
    setForm({ id: null, name: "", latest_progress: "", next_step: "", date: toDateInput(new Date().toISOString()), status: "published" });
  }

  function startEdit(item: BuildItem) {
    setForm({
      id: item.id,
      name: item.name,
      latest_progress: item.latest_progress,
      next_step: item.next_step,
      date: toDateInput(item.progressed_at || item.created_at),
      status: item.status === "published" ? "published" : "draft",
    });
  }

  async function save() {
    if (!form) return;
    if (!form.name.trim() || !form.latest_progress.trim()) {
      push("请填写标题和进展内容", "error");
      return;
    }
    const current = progress.find((item) => item.id === form.id);
    // 编辑时原样带回页面上不再展示的旧字段，避免更新时被清空。
    const input: BuildInput = {
      ...(current ? { slug: current.slug, one_liner: current.one_liner, stage: current.stage, round_goal: current.round_goal, detail_url: current.detail_url, demo_url: current.demo_url, repo_url: current.repo_url, sort_order: current.sort_order } : { slug: `progress-${Date.now().toString(36)}` }),
      project_id: projectId,
      name: form.name.trim(),
      latest_progress: form.latest_progress.trim(),
      next_step: form.next_step.trim(),
      status: form.status,
      progressed_at: `${form.date}T12:00:00+08:00`,
    };
    setSaving(true);
    try {
      const saved = form.id ? await updateAdminBuild(form.id, input) : await createAdminBuild(input);
      setProgress((items) => sortByDate([saved, ...items.filter((item) => item.id !== saved.id)]));
      setForm(null);
      push(form.id ? "进展已更新" : "进展已记录", "success");
    } catch (err) {
      push(errorMessage(err, "保存进展失败"), "error");
    } finally {
      setSaving(false);
    }
  }

  async function remove(item: BuildItem) {
    if (!confirm(`删除进展「${item.name}」？`)) return;
    try {
      await deleteAdminBuild(item.id);
      setProgress((items) => items.filter((entry) => entry.id !== item.id));
      push("进展已删除", "success");
    } catch (err) {
      push(errorMessage(err, "删除进展失败"), "error");
    }
  }

  if (loading) return <div className="project-cms-panel project-cms-process-loading"><Loader2 className="animate-spin" size={16} />正在读取项目过程</div>;

  return (
    <div className="project-cms-process-grid">
      <section className="project-cms-panel">
        <div className="project-cms-panel-heading project-cms-panel-heading-action">
          <span><Footprints size={17} /></span>
          <div><h2>进展</h2><p>按日期记下项目推进到了哪里。公开的进展会进入笔记时间线和项目页，最新一条的「下一步」会显示在项目页上。</p></div>
          {!form && <Button icon={<Plus size={15} />} onClick={startNew} variant="primary">记一条进展</Button>}
        </div>

        {form && (
          <div className="project-cms-progress-form">
            <div className="project-cms-form-grid">
              <Field label="标题" placeholder="例如：接通发布主链路" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
              <label className="project-cms-date-field">日期<input className="field-surface" type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label>
            </div>
            <Field label="进展" meta={<span>{form.latest_progress.length}/300</span>} multiline placeholder="这一步完成了什么、得出了什么结论" value={form.latest_progress} onChange={(value) => setForm({ ...form, latest_progress: value.slice(0, 300) })} />
            <Field label="下一步" meta={<span>{form.next_step.length}/300</span>} multiline placeholder="接下来准备做什么（可留空）" value={form.next_step} onChange={(value) => setForm({ ...form, next_step: value.slice(0, 300) })} />
            <div className="project-cms-progress-actions">
              <div aria-label="进展可见性" className="project-cms-segment" role="radiogroup">
                {(["published", "draft"] as const).map((status) => <button aria-checked={form.status === status} key={status} onClick={() => setForm({ ...form, status })} role="radio" type="button">{status === "published" ? "公开" : "草稿"}</button>)}
              </div>
              <Button onClick={() => setForm(null)} variant="ghost">取消</Button>
              <Button disabled={saving} icon={saving ? <Loader2 className="animate-spin" size={15} /> : undefined} onClick={save} variant="primary">{form.id ? "保存修改" : "记录进展"}</Button>
            </div>
          </div>
        )}

        {progress.length === 0 ? (
          <p className="project-cms-empty-line">还没有进展记录。</p>
        ) : (
          <ol className="project-cms-timeline">
            {progress.map((item) => (
              <li key={item.id}>
                <time dateTime={item.progressed_at || item.created_at}>{formatDate(item.progressed_at || item.created_at)}</time>
                <div>
                  <div className="project-cms-timeline-title"><strong>{item.name}</strong>{item.status !== "published" && <Badge tone="amber">草稿</Badge>}</div>
                  {item.latest_progress && <p>{item.latest_progress}</p>}
                  {item.next_step && <p className="project-cms-next-step">下一步：{item.next_step}</p>}
                </div>
                <div className="project-cms-row-actions">
                  <button aria-label={`编辑进展 ${item.name}`} onClick={() => startEdit(item)} type="button"><Pencil size={14} /></button>
                  <button aria-label={`删除进展 ${item.name}`} className="is-danger" onClick={() => remove(item)} type="button"><Trash2 size={14} /></button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="project-cms-panel">
        <div className="project-cms-panel-heading"><span><BookOpen size={17} /></span><div><h2>关联记录</h2><p>在文章或札记里选择这个项目后，会自动出现在这里。</p></div></div>
        <RelatedList empty="还没有关联的长文。" href="/admin/postManagement" records={related.articles} title="长文" />
        <RelatedList empty="还没有关联的札记。" href="/admin/observatory" records={related.notes} title="札记" />
      </section>
    </div>
  );
}

function RelatedList({ title, records, href, empty }: { title: string; records: ProjectRelated["articles"]; href: string; empty: string }) {
  return (
    <div className="project-cms-related">
      <h3>{title}<span>{records.length}</span><a href={href}>去管理 →</a></h3>
      {records.length === 0 ? <p className="project-cms-empty-line">{empty}</p> : (
        <ul>
          {records.map((record) => (
            <li key={record.id}>
              <time dateTime={record.date}>{formatDate(record.date)}</time>
              <span>{record.title}</span>
              {record.visibility === "private" ? <Badge>私有</Badge> : record.status === "draft" ? <Badge tone="amber">草稿</Badge> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function sortByDate(items: BuildItem[]) {
  return [...items].sort((a, b) => Date.parse(b.progressed_at || b.created_at) - Date.parse(a.progressed_at || a.created_at));
}

function toDateInput(value: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}

function formatDate(value: string) {
  return toDateInput(value).replaceAll("-", ".");
}

function errorMessage(err: unknown, fallback: string) {
  return err && typeof err === "object" && "message" in err ? String((err as { message: unknown }).message) : fallback;
}
