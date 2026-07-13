"use client";

import { labExperiments } from "@/lib/labHomeContent";
import { SectionIntro } from "@/components/home/sectionIntro";
import { motion } from "motion/react";
import { revealGroup, revealItem, viewportOnce } from "@/components/home/motionConfig";

export function ExperimentsSection() {
  return (
    <motion.section className="lab-section lab-experiments" id="experiments" initial="hidden" variants={revealGroup} viewport={viewportOnce} whileInView="visible">
      <div className="lab-shell">
        <SectionIntro
          description="来自受控失败、未完成工具和技术问题的笔记。"
          index="02 / 归档"
          title="实验"
        />
        <div className="lab-experiment-list">
          {labExperiments.map((experiment) => (
            <motion.article className="lab-experiment-row" key={experiment.id} variants={revealItem}>
              <span className="lab-experiment-number lab-mono">EXP—{experiment.number}</span>
              <div className="lab-experiment-copy">
                <h3>{experiment.name}</h3>
                <p>{experiment.summary}</p>
              </div>
              <div className="lab-experiment-tags">
                {experiment.tags.map((tag) => <span className="lab-mono" key={tag}>{tag}</span>)}
              </div>
              <span className="lab-experiment-status lab-mono"><i /> {experiment.status}</span>
            </motion.article>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
