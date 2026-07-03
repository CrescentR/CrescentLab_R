import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { HomeAnnouncement } from "@/types/home";

export function AnnouncementBar({ announcement }: { announcement: HomeAnnouncement }) {
  return (
    <section className="border-b border-[var(--border-soft)]" data-lab-animate>
      <div className="home-container flex items-center justify-between gap-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="home-announcement-label">{announcement.label}</span>
          <p className="truncate text-sm text-[var(--muted)]">{announcement.message}</p>
        </div>
        <Link className="hidden shrink-0 items-center gap-1 font-lab-mono text-xs font-semibold text-[var(--text-strong)] sm:inline-flex" href={announcement.href}>
          {announcement.actionLabel} <ArrowRight size={13} />
        </Link>
      </div>
    </section>
  );
}
