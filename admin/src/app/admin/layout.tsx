import { ReactNode } from "react";
import { AdminShell } from "@/components/admin/adminShell";
import { ToastProvider } from "@/components/ui/toast";
import "./admin.css";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <div className="admin-shell">
        <AdminShell>{children}</AdminShell>
      </div>
    </ToastProvider>
  );
}
