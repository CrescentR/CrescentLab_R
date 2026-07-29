import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { HomeAnnouncement } from "@/types/home";

export function AnnouncementBar({ announcement }: { announcement: HomeAnnouncement }) {
  return (
    <section className="home-announcement" data-lab-animate>
      <div className="home-container home-announcement-shell">
        <div className="home-announcement-message">
          <span className="home-announcement-dot" />
          <span className="sr-only">{announcement.label}</span>
          <p>{announcement.message}</p>
        </div>
        <Link className="home-announcement-link" href={announcement.href}>
          {announcement.actionLabel} <ArrowRight size={13} />
        </Link>
      </div>
    </section>
  );
}
