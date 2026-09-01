import { LayoutDashboard } from "lucide-react";
import type { LabActivity } from "@/types/content";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toneDotClass } from "./homeTone";

const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3001";

export function ActivitySection({ activities, canEnterAdmin }: { activities: LabActivity[]; canEnterAdmin: boolean }) {
  return (
    <section className="home-container home-activity-section" id="activity">
      <div className="home-activity-main" data-lab-animate>
        <div className="home-activity-heading">
          <h2>过程记录</h2>
          <p>这些不是另一组卡片，而是站点持续发生变化的时间线。它们让读者知道这里不是静态橱窗。</p>
        </div>
        <div className="home-timeline">
          {activities.map((activity) => (
            <ActivityRow activity={activity} key={activity.id} />
          ))}
        </div>
      </div>

      <aside className="home-maintenance-card" data-lab-animate>
        <span>维护</span>
        <h2>今日维护</h2>
        <p>
          首页用于读者进入；后台用于持续维护。两个入口的边界要清楚，但视觉上仍然是一套系统。
        </p>
        {canEnterAdmin && (
          <div className="home-maintenance-action">
            <ButtonLink href={`${adminUrl}/admin`} icon={<LayoutDashboard size={15} />} variant="secondary">
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
    <div className="home-timeline-row">
      <span className={cn("home-timeline-dot", toneDotClass[activity.tone])} />
      <span className="home-timeline-time">{activity.time}</span>
      <div className="home-timeline-copy">
        <h3>{activity.title}</h3>
        <p>{activity.detail}</p>
      </div>
    </div>
  );
}
