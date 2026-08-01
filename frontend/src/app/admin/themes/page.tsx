"use client";

import { AdminPrototypeWorkbench } from "@/components/admin/adminPrototypeWorkbench";
import { themesPrototypeSeed } from "@/lib/adminPrototypeSeeds";

export default function ThemesPage() {
  return (
    <AdminPrototypeWorkbench
      badge="主题"
      badgeTone="purple"
      createLabel="登记主题"
      description="主题切换与预览的管理雏形。可标记当前激活主题；真实主题包与样式变量注入后续接入。"
      emptyHint="暂无主题记录。"
      moduleKey="themes"
      seedItems={themesPrototypeSeed}
      statuses={[
        { value: "active", label: "使用中", tone: "green" },
        { value: "available", label: "可选", tone: "cyan" },
        { value: "draft", label: "草稿", tone: "amber" },
      ]}
      title="主题管理"
    />
  );
}
