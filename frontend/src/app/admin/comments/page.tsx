"use client";

import { AdminPrototypeWorkbench } from "@/components/admin/adminPrototypeWorkbench";
import { commentsPrototypeSeed } from "@/lib/adminPrototypeSeeds";

export default function CommentsPage() {
  return (
    <AdminPrototypeWorkbench
      badge="评论"
      badgeTone="green"
      createLabel="新增评论记录"
      description="雏形阶段模拟评论审核流：待审、通过、垃圾。真实接口接入后将绑定文章与用户。"
      emptyHint="暂无评论记录。"
      moduleKey="comments"
      seedItems={commentsPrototypeSeed}
      statuses={[
        { value: "pending", label: "待审", tone: "amber" },
        { value: "approved", label: "已通过", tone: "green" },
        { value: "spam", label: "垃圾", tone: "rose" },
      ]}
      title="评论管理"
    />
  );
}
