"use client";

import { AdminPrototypeWorkbench } from "@/components/admin/adminPrototypeWorkbench";
import { mediaPrototypeSeed } from "@/lib/adminPrototypeSeeds";

export default function MediaPage() {
  return (
    <AdminPrototypeWorkbench
      badge="媒体库"
      badgeTone="amber"
      createLabel="登记媒体"
      description="雏形阶段可管理媒体条目的标题、说明与状态。后续将接入真实上传、存储策略、预览与文章引用。"
      emptyHint="还没有媒体记录，先登记一条示例。"
      moduleKey="media"
      seedItems={mediaPrototypeSeed}
      statuses={[
        { value: "ready", label: "可用", tone: "green" },
        { value: "processing", label: "处理中", tone: "amber" },
        { value: "failed", label: "失败", tone: "rose" },
      ]}
      title="媒体库"
    />
  );
}
