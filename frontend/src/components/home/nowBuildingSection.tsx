"use client";

import { ArrowUpRight, Box, Orbit, Sparkles, TerminalSquare } from "lucide-react";
import { motion } from "motion/react";
import { nowBuilding } from "@/lib/labHomeContent";
import { SectionIntro } from "@/components/home/sectionIntro";
import { hoverTransition, revealGroup, revealItem, viewportOnce } from "@/components/home/motionConfig";

const icons = [Box, TerminalSquare, Sparkles, Orbit] as const;

export function NowBuildingSection() {
  return (
    <motion.section
      className="lab-section lab-shell"
      id="building"
      initial="hidden"
      variants={revealGroup}
      viewport={viewportOnce}
      whileInView="visible"
    >
      <SectionIntro
        description="Four active builds, observed while they are still changing."
        index="01 / NOW"
        title="Now Building"
      />
      <div className="lab-bento-grid">
        {nowBuilding.map((project, index) => {
          const Icon = icons[index];
          return (
            <motion.article
              className={`lab-build-card lab-build-card-${project.tone}`}
              key={project.id}
              transition={hoverTransition}
              variants={revealItem}
              whileHover={{ rotateX: index % 2 === 0 ? 2 : -2, rotateY: index % 2 === 0 ? -2 : 2, y: -4 }}
            >
              <div className="lab-build-card-head">
                <span className="lab-build-index lab-mono">BUILD / {project.index}</span>
                <ArrowUpRight size={17} />
              </div>
              <div className="lab-build-visual" aria-hidden="true">
                <Icon size={index === 0 ? 38 : 30} strokeWidth={1.25} />
                <span>{project.mark}</span>
              </div>
              <div>
                <p className="lab-build-status lab-mono"><i /> IN PROGRESS</p>
                <h3>{project.name}</h3>
              </div>
            </motion.article>
          );
        })}
      </div>
    </motion.section>
  );
}
