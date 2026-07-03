import { LayoutDashboard, PenLine, RadioTower } from "lucide-react";
import type { LabActivity } from "@/types/content";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./sectionHeading";
import { toneDotClass } from "./homeTone";

export function ActivitySection({ activities, canEnterAdmin }: { activities: LabActivity[]; canEnterAdmin: boolean }) {
  return (
    <section className="home-container grid gap-12 py-12 md:py-16 lg:grid-cols-[minmax(0,1fr)_340px]" id="activity">
      <div data-lab-animate>
        <SectionHeading
          eyebrow="Lab log"
          icon={<RadioTower size={18} />}
          title="实验记录"
          description="这些不是另一组卡片，而是站点持续发生变化的时间线。它们让读者知道这里不是静态橱窗。"
        />
        <div className="mt-7 border-t border-[var(--border-soft)]">
          {activities.map((activity) => (
            <ActivityRow activity={activity} key={activity.id} />
          ))}
        </div>
      </div>

      <aside className="home-side-panel p-6" data-lab-animate>
        <div className="flex items-center gap-2 text-[var(--amber)]">
          <PenLine size={18} />
          <h2 className="font-lab-display text-xl font-semibold text-[var(--text-strong)]">今日维护</h2>
        </div>
        <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
          首页用于读者进入；后台用于持续维护。两个入口的边界要清楚，但视觉上仍然是一套系统。
        </p>
        {canEnterAdmin && (
          <div className="mt-6">
            <ButtonLink href="/admin" icon={<LayoutDashboard size={15} />} variant="secondary">
              打开后台
            </ButtonLink>
          </div>
        )}
      </aside>
    </section>
  );
}

function ActivityRow({ activity }: { activity: LabActivity }) {
  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-4 border-b border-[var(--border-soft)] py-5">
      <span className="font-lab-mono text-xs text-[var(--muted-low)]">{activity.time}</span>
      <div className="border-l border-[var(--border-soft)] pl-5">
        <div className="flex items-center gap-3">
          <span className={cn("size-2 rounded-full", toneDotClass[activity.tone])} />
          <h3 className="text-sm font-medium text-[var(--text-strong)]">{activity.title}</h3>
        </div>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{activity.detail}</p>
      </div>
    </div>
  );
}
