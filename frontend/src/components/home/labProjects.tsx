"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, X } from "lucide-react";
import type { ProjectSite } from "@/types/content";
import { labProjects } from "@/lib/labHomeContent";
import { SectionIntro } from "@/components/home/sectionIntro";
import { hoverTransition, labEase, revealGroup, revealItem, viewportOnce } from "@/components/home/motionConfig";

export function LabProjects() {
  const [selectedProject, setSelectedProject] = useState<ProjectSite | null>(null);

  useEffect(() => {
    if (!selectedProject) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedProject(null);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [selectedProject]);

  return (
    <motion.section className="lab-section lab-shell" id="projects" initial="hidden" variants={revealGroup} viewport={viewportOnce} whileInView="visible">
      <SectionIntro
        description="存活足够久、成为真实项目的系统。"
        index="03 / 精选"
        title="项目"
      />
      <div className="lab-project-grid">
        {labProjects.map((project, index) => (
          <motion.button
            className={`lab-project-card lab-project-card-${index + 1}`}
            key={project.id}
            layoutId={`project-${project.id}`}
            onClick={() => setSelectedProject(project)}
            transition={hoverTransition}
            type="button"
            variants={revealItem}
            whileHover={{ y: -5 }}
          >
            <ProjectCardContent index={index} project={project} />
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {selectedProject ? (
          <motion.div
            animate={{ opacity: 1 }}
            className="lab-project-modal-backdrop"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            onMouseDown={() => setSelectedProject(null)}
            role="presentation"
            transition={{ duration: 0.2 }}
          >
            <motion.article
              aria-label={`${selectedProject.title} 项目详情`}
              aria-modal="true"
              className="lab-project-modal"
              layoutId={`project-${selectedProject.id}`}
              onMouseDown={(event) => event.stopPropagation()}
              role="dialog"
              transition={{ duration: 0.48, ease: labEase }}
            >
              <button aria-label="关闭项目详情" className="lab-project-modal-close" onClick={() => setSelectedProject(null)} type="button"><X size={18} /></button>
              <span className="lab-mono">SELECTED PROJECT / {selectedProject.category}</span>
              <h3>{selectedProject.title}</h3>
              <strong>{selectedProject.subtitle}</strong>
              <p>{selectedProject.description}</p>
              <div className="lab-project-modal-sections">
                {selectedProject.sections.map((section, index) => (
                  <div key={section}><span className="lab-mono">0{index + 1}</span><p>{section}</p></div>
                ))}
              </div>
            </motion.article>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.section>
  );
}

function ProjectCardContent({ index, project }: { index: number; project: ProjectSite }) {
  return (
    <>
      <div className="lab-project-card-top">
        <span className="lab-mono">PRJ—0{index + 1}</span>
        <ArrowUpRight size={18} />
      </div>
      <div className="lab-project-signal" aria-hidden="true"><span /></div>
      <div className="lab-project-card-copy">
        <p className="lab-mono">{project.category} / {project.status}</p>
        <h3>{project.title}</h3>
        <strong>{project.subtitle}</strong>
        <p>{project.description}</p>
      </div>
    </>
  );
}
