"use client";

import { Grid3X3, Lock, Search, ShieldCheck, UserCog, Users } from "lucide-react";
import { useState } from "react";
import { adminUsers } from "@/lib/mock-data";
import { personas } from "@/lib/personas";
import { PersonaRole, useUiStore } from "@/store/ui-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { StatusDot } from "@/components/ui/status-dot";
import { cn } from "@/lib/utils";

type AccessRole = Extract<PersonaRole, "member" | "admin">;

const roleCards = [
  {
    role: "member",
    title: "普通用户",
    detail: "可阅读公开内容、发表评论、订阅通知、维护个人资料。",
    tone: "green",
    modules: ["阅读中心", "评论互动", "个人资料", "订阅通知"],
  },
  {
    role: "admin",
    title: "管理员",
    detail: "在普通用户能力之上，额外拥有后台、内容、用户、插件、主题和系统配置权限。",
    tone: "purple",
    modules: ["后台控制台", "内容管理", "用户权限", "系统设置", "插件主题"],
  },
] as const;

const sharedPermissions = ["read:public", "comment:create", "profile:update", "notification:subscribe"];
const matrixRows = [
  { name: "Articles", member: [true, false, false], admin: [true, true, true] },
  { name: "Comments", member: [true, true, false], admin: [true, true, true] },
  { name: "Albums", member: [true, false, false], admin: [true, true, true] },
  { name: "Users", member: [false, false, false], admin: [true, true, true] },
  { name: "Plugins", member: [false, false, false], admin: [true, true, true] },
] as const;

export function UserAccess() {
  const activePersona = useUiStore((state) => state.activePersona);
  const setActivePersona = useUiStore((state) => state.setActivePersona);
  const [selectedRole, setSelectedRole] = useState<AccessRole>(activePersona === "admin" ? "admin" : "member");

  return (
    <main className="flex-1 overflow-auto px-4 py-6 md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <Panel className="lab-card p-6">
            <Badge tone="rose">Access Lab</Badge>
            <h1 className="mt-4 font-lab-display text-3xl font-semibold text-[var(--text-strong)]">用户与权限工作台</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
              当前是前端原型：管理员和普通用户有共享权限，但卡片、模块入口和后台访问能力会按身份区分。真实后端接入后，这里会连接用户组、权限点和审计日志。
            </p>
          </Panel>

          <Panel className="lab-card p-5">
            <div className="field-surface flex h-10 items-center gap-2 rounded-[var(--radius)] px-4 font-lab-mono text-xs text-[var(--muted-low)]">
              <Search size={15} />
              Search users or roles...
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {(["member", "admin"] as AccessRole[]).map((role) => (
                <Button
                  className={cn(selectedRole === role && "border-[var(--cyan)] bg-[var(--cyan-soft)]")}
                  key={role}
                  onClick={() => {
                    setSelectedRole(role);
                    setActivePersona(role);
                  }}
                  variant="secondary"
                >
                  {personas[role].name}
                </Button>
              ))}
            </div>
          </Panel>
        </header>

        <section className="grid gap-4 lg:grid-cols-2">
          {roleCards.map((card) => {
            const active = selectedRole === card.role;
            return (
              <Panel className={cn("lab-card p-5 transition-colors", active && "border-[var(--cyan)]")} key={card.role}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Badge tone={card.tone}>{active ? "active demo" : "available role"}</Badge>
                    <h2 className="mt-4 font-lab-display text-2xl font-semibold text-[var(--text-strong)]">{card.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{card.detail}</p>
                  </div>
                  <span className="grid size-12 place-items-center rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface-field)] text-[var(--cyan)]">
                    {card.role === "admin" ? <UserCog size={22} /> : <Users size={22} />}
                  </span>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {card.modules.map((module) => (
                    <Badge key={module} tone={card.role === "admin" ? "purple" : "green"}>
                      {module}
                    </Badge>
                  ))}
                </div>
              </Panel>
            );
          })}
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-5 py-4">
              <div className="flex items-center gap-2">
                <Users className="text-[var(--cyan)]" size={18} />
                <h2 className="font-lab-display text-lg font-semibold text-[var(--text-strong)]">User Directory</h2>
              </div>
              <Badge tone="cyan">mock users</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead className="bg-[var(--surface-field)] font-lab-mono text-xs text-[var(--muted)]">
                  <tr>
                    <th className="px-5 py-4 font-medium">User</th>
                    <th className="px-5 py-4 font-medium">Role</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4 font-medium">Access Focus</th>
                    <th className="px-5 py-4 text-right font-medium">Last Login</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-soft)]">
                  {adminUsers.map((user) => (
                    <tr className="hover:bg-[var(--surface-field)]" key={user.id}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="grid size-9 place-items-center rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-field)] font-lab-mono text-xs text-[var(--text-strong)]">
                            {user.name
                              .split(" ")
                              .map((part) => part[0])
                              .join("")}
                          </span>
                          <span>
                            <span className="block text-sm font-medium text-[var(--text)]">{user.name}</span>
                            <span className="block font-lab-mono text-xs text-[var(--muted)]">{user.email}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={user.role === "super admin" ? "purple" : user.role === "editor" ? "cyan" : "neutral"}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-2 font-lab-mono text-xs text-[var(--text)]">
                          <StatusDot active={user.status === "active"} />
                          {user.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-[var(--muted)]">
                        {user.role === "super admin" ? "All modules" : user.role === "editor" ? "Content + comments" : "Personal content"}
                      </td>
                      <td className="px-5 py-4 text-right font-lab-mono text-xs text-[var(--muted)]">{user.lastLogin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-5 py-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-[var(--lavender)]" size={18} />
                <h2 className="font-lab-display text-lg font-semibold text-[var(--text-strong)]">Role Matrix</h2>
              </div>
              <Badge tone={selectedRole === "admin" ? "purple" : "green"}>{personas[selectedRole].label}</Badge>
            </div>
            <div className="p-5">
              <div className="mb-5 rounded-[var(--radius)] border border-[var(--border-soft)] bg-[var(--surface-field)] p-4">
                <span className="font-lab-mono text-xs uppercase text-[var(--muted-low)]">shared permissions</span>
                <div className="mt-3 flex flex-wrap gap-2">
                  {sharedPermissions.map((permission) => (
                    <Badge key={permission} tone="green">
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-[1fr_repeat(3,48px)] gap-y-4 font-lab-mono text-xs text-[var(--muted)]">
                <span>Module</span>
                <span className="text-center">R</span>
                <span className="text-center">W</span>
                <span className="text-center">D</span>
                {matrixRows.map((row) => (
                  <PermissionRow flags={row[selectedRole]} key={row.name} name={row.name} />
                ))}
              </div>
              <div className="mt-6 flex justify-end gap-3 border-t border-[var(--border-soft)] pt-5">
                <Button variant="secondary">Discard</Button>
                <Button icon={<Grid3X3 size={15} />} variant="primary">
                  Save Matrix
                </Button>
              </div>
            </div>
          </Panel>
        </section>
      </div>
    </main>
  );
}

function PermissionRow({ flags, name }: { flags: readonly boolean[]; name: string }) {
  return (
    <>
      <span className="border-l-2 border-[var(--border-soft)] pl-4 text-[var(--text)]">{name}</span>
      {flags.map((enabled, index) => (
        <span className="flex justify-center" key={`${name}-${index}`}>
          <span className={cn("grid size-5 place-items-center rounded border", enabled ? "border-[var(--cyan)] bg-[var(--cyan-soft)] text-[var(--cyan)]" : "border-[var(--border-soft)] bg-[var(--surface-field)] text-[var(--muted-low)]")}>
            {enabled ? <span className="size-2 rounded-sm bg-[var(--cyan)]" /> : <Lock size={10} />}
          </span>
        </span>
      ))}
    </>
  );
}
