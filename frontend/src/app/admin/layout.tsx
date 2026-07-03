import { ReactNode } from "react";
import { AdminShell } from "@/components/admin/adminShell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
