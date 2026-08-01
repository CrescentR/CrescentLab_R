"use client";

import { AdminPrototypeWorkbench } from "@/components/admin/adminPrototypeWorkbench";
import { buildsPrototypeSeed } from "@/lib/adminPrototypeSeeds";

export default function BuildsPage() {
  return (
    <AdminPrototypeWorkbench
      badge="构建中"
      badgeTone="cyan"
      createLabel="新增构建项"
      description="对应前台「正在构建」区块的管理雏形。可维护进行中 / 计划中 / 阻塞项，后续接入 builds 表与公开供给 API。"
      emptyHint="还没有构建项。"
      moduleKey="builds"
      seedItems={buildsPrototypeSeed}
      statuses={[
        { value: "in_progress", label: "进行中", tone: "cyan" },
        { value: "planned", label: "计划中", tone: "amber" },
        { value: "blocked", label: "阻塞", tone: "rose" },
        { value: "shipped", label: "已交付", tone: "green" },
      ]}
      title="正在构建"
    />
  );
}
