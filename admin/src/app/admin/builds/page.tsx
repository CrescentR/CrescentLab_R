"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// 进展已归入项目编辑页的「过程」分区。
export default function BuildsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/projects");
  }, [router]);

  return (
    <main className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--muted)]">
      进展已归入项目，正在打开项目管理…
    </main>
  );
}
