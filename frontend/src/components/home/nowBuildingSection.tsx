"use client";

import { ArrowUpRight, Box, Orbit, Sparkles, TerminalSquare } from "lucide-react";
import { motion } from "motion/react";
import { useRef } from "react";
import { nowBuilding } from "@/lib/labHomeContent";
import { gsap, useGSAP } from "@/lib/gsap";
import { SectionIntro } from "@/components/home/sectionIntro";
import { cardHover, fadeUp, stagger, viewport } from "@/components/home/motionConfig";

const icons = [Box, TerminalSquare, Sparkles, Orbit] as const;

export function NowBuildingSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      const media = gsap.matchMedia();
      media.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
        const cards = gsap.utils.toArray<HTMLElement>("[data-build-card]", section);
        const cleanups = cards.map((card) => {
          const onPointerMove = (event: PointerEvent) => {
            const bounds = card.getBoundingClientRect();
            gsap.to(card, {
              "--lab-spot-x": `${event.clientX - bounds.left}px`,
              "--lab-spot-y": `${event.clientY - bounds.top}px`,
              duration: 0.35,
              ease: "power3.out",
              overwrite: "auto",
            });
          };
          const onPointerEnter = () => gsap.to(card, { "--lab-spot-opacity": 1, duration: 0.2 });
          const onPointerLeave = () => gsap.to(card, { "--lab-spot-opacity": 0, duration: 0.45 });

          card.addEventListener("pointermove", onPointerMove);
          card.addEventListener("pointerenter", onPointerEnter);
          card.addEventListener("pointerleave", onPointerLeave);

          return () => {
            card.removeEventListener("pointermove", onPointerMove);
            card.removeEventListener("pointerenter", onPointerEnter);
            card.removeEventListener("pointerleave", onPointerLeave);
          };
        });

        return () => cleanups.forEach((cleanup) => cleanup());
      });

      return () => media.revert();
    },
    { scope: sectionRef },
  );

  return (
    <motion.section
      className="lab-section lab-shell"
      id="building"
      initial="hidden"
      ref={sectionRef}
      variants={stagger}
      viewport={viewport}
      whileInView="visible"
    >
      <SectionIntro
        description="四个活跃的构建，在变化时进行观察。"
        index="01 / 正在构建"
        title="正在构建"
      />
      <div className="lab-bento-grid">
        {nowBuilding.map((project, index) => {
          const Icon = icons[index];
          return (
            <motion.article
              className={`lab-build-card lab-build-card-${project.tone}`}
              data-build-card
              key={project.id}
              variants={fadeUp}
              {...cardHover}
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
                <p className="lab-build-status lab-mono"><i /> 进行中</p>
                <h3>{project.name}</h3>
              </div>
            </motion.article>
          );
        })}
      </div>
    </motion.section>
  );
}
