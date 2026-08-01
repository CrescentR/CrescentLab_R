"use client";

import { AdminPrototypeWorkbench } from "@/components/admin/adminPrototypeWorkbench";
import { pluginsPrototypeSeed } from "@/lib/adminPrototypeSeeds";

export default function PluginsPage() {
  return (
    <AdminPrototypeWorkbench
      badge="插件"
      badgeTone="cyan"
      createLabel="登记插件"
      description="插件启停与配置的管理雏形。当前仅本地记录状态，后续接入插件清单与运行时开关。"
      emptyHint="暂无插件记录。"
      moduleKey="plugins"
      seedItems={pluginsPrototypeSeed}
      statuses={[
        { value: "enabled", label: "已启用", tone: "green" },
        { value: "disabled", label: "已停用", tone: "neutral" },
        { value: "error", label: "异常", tone: "rose" },
      ]}
      title="插件中心"
    />
  );
}
