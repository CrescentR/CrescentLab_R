"use client";

import { ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import { labNotes } from "@/lib/labHomeContent";
import { SectionIntro } from "@/components/home/sectionIntro";
import { revealGroup, revealItem, viewportOnce } from "@/components/home/motionConfig";

export function LabNotes() {
  return (
    <motion.section className="lab-section lab-notes lab-shell" id="notes" initial="hidden" variants={revealGroup} viewport={viewportOnce} whileInView="visible">
      <SectionIntro
        description="Field notes from building systems in public and revising them in private."
        index="04 / LOG"
        title="Notes"
      />
      <div className="lab-note-timeline">
        {labNotes.map((note) => (
          <motion.article className="lab-note-row" key={note.id} variants={revealItem}>
            <div className="lab-note-date lab-mono">
              <span />
              {note.updatedAt}
            </div>
            <div className="lab-note-copy">
              <p className="lab-mono">{note.category}</p>
              <h3>{note.title}</h3>
              <p>{note.excerpt}</p>
            </div>
            <a aria-label={`阅读 ${note.title}`} href="#notes"><ArrowUpRight size={17} /></a>
          </motion.article>
        ))}
      </div>
    </motion.section>
  );
}
