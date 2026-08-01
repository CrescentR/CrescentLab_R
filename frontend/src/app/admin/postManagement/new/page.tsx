"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewPostPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/postManagement");
  }, [router]);

  return (
    <main className="flex min-h-[40vh] items-center justify-center text-sm text-[var(--muted)]">
      正在打开文章管理…
    </main>
  );
}
