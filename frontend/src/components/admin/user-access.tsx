import { Grid3X3, Search, ShieldCheck, Users } from "lucide-react";
import { adminUsers } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { StatusDot } from "@/components/ui/status-dot";

export function UserAccess() {
  return (
    <main className="flex-1 overflow-auto px-5 py-8 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--border-soft)] pb-6">
          <div>
            <h1 className="font-lab-display text-3xl font-semibold text-[var(--text-strong)]">Access Management</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Configure user permissions and role hierarchy. This screen is static until auth and user APIs are designed.
            </p>
          </div>
          <div className="field-surface flex h-10 min-w-[260px] items-center gap-2 rounded-full px-4 font-lab-mono text-xs text-[var(--muted-low)]">
            <Search size={15} />
            Search users or roles...
          </div>
        </header>

        <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
          <Panel>
            <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-5 py-4">
              <div className="flex items-center gap-2">
                <Users className="text-[var(--cyan)]" size={18} />
                <h2 className="font-lab-display text-lg font-semibold text-[var(--text-strong)]">User Directory</h2>
              </div>
              <Button variant="ghost">View All</Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-left">
                <thead className="bg-black/20 font-lab-mono text-xs text-[var(--muted)]">
                  <tr>
                    <th className="px-5 py-4 font-medium">User</th>
                    <th className="px-5 py-4 font-medium">Role</th>
                    <th className="px-5 py-4 font-medium">Status</th>
                    <th className="px-5 py-4 text-right font-medium">Last Login</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-soft)]">
                  {adminUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className="grid size-8 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface-field)] font-lab-mono text-xs">
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
                      <td className="px-5 py-4 text-right font-lab-mono text-xs text-[var(--muted)]">{user.lastLogin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel>
            <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-5 py-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-[var(--lavender)]" size={18} />
                <h2 className="font-lab-display text-lg font-semibold text-[var(--text-strong)]">Role Matrix</h2>
              </div>
              <Badge tone="cyan">Editor</Badge>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-[1fr_repeat(3,48px)] gap-y-4 font-lab-mono text-xs text-[var(--muted)]">
                <span>Content Modules</span>
                <span className="text-center">R</span>
                <span className="text-center">W</span>
                <span className="text-center">D</span>
                {["Articles", "Pages", "Images / Video"].map((name) => (
                  <PermissionRow key={name} name={name} />
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

function PermissionRow({ name }: { name: string }) {
  return (
    <>
      <span className="border-l-2 border-[var(--border-soft)] pl-4 text-[var(--text)]">{name}</span>
      {[0, 1, 2].map((index) => (
        <span className="flex justify-center" key={index}>
          <span className={index < 2 ? "size-3 rounded-sm bg-[var(--cyan)]" : "size-3 rounded-sm bg-[var(--text)]"} />
        </span>
      ))}
    </>
  );
}
