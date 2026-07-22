"use client";

import { ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import { labNotes } from "@/lib/labHomeContent";
import { SectionIntro } from "@/components/home/sectionIntro";
import { fadeUp, stagger, viewport } from "@/components/home/motionConfig";

export function LabNotes() {
  return (
    <motion.section className="lab-section lab-notes lab-shell" id="notes" initial="hidden" variants={stagger} viewport={viewport} whileInView="visible">
      <SectionIntro
        description="在公开构建系统和私下修订过程中的田野笔记。"
        index="04 / 日志"
        title="笔记"
      />
      <div className="lab-note-timeline">
        {labNotes.map((note) => (
          <motion.article className="lab-note-row" key={note.id} variants={fadeUp}>
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
