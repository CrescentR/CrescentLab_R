"use client";

import { AdminPrototypeWorkbench } from "@/components/admin/adminPrototypeWorkbench";
import { usersPrototypeSeed } from "@/lib/adminPrototypeSeeds";

export default function UsersPage() {
  return (
    <AdminPrototypeWorkbench
      badge="用户"
      badgeTone="rose"
      createLabel="登记用户"
      description="用户与角色管理雏形。登录鉴权已接入真实后端；此处列表用于规划成员/管理员/邀请态，后续替换为用户 CRUD API。"
      emptyHint="暂无用户记录。"
      moduleKey="users"
      seedItems={usersPrototypeSeed}
      statuses={[
        { value: "admin", label: "管理员", tone: "purple" },
        { value: "member", label: "普通用户", tone: "green" },
        { value: "invited", label: "待激活", tone: "amber" },
        { value: "disabled", label: "已停用", tone: "neutral" },
      ]}
      title="用户管理"
    />
  );
}
