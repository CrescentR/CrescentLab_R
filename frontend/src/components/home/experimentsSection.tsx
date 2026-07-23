"use client";

import { useState } from "react";
import { motion, type PanInfo, useReducedMotion } from "motion/react";
import { labExperiments } from "@/lib/labHomeContent";
import { SectionIntro } from "@/components/home/sectionIntro";

export function ExperimentsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  const showExperiment = (index: number) => {
    if (index < 0 || index >= labExperiments.length || index === activeIndex) return;
    setActiveIndex(index);
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeDistance = info.offset.x + info.velocity.x * 0.12;
    if (swipeDistance < -80) {
      showExperiment(activeIndex + 1);
    } else if (swipeDistance > 80) {
      showExperiment(activeIndex - 1);
    }
  };

  return (
    <section className="lab-section lab-experiments" id="experiments">
      <div className="lab-shell">
        <SectionIntro
          description="来自受控失败、未完成工具和技术问题的笔记。"
          index="02 / 归档"
          title="实验观测台"
        />

        <div className="lab-observatory">
          <div className="lab-observatory-rail">
            <ol aria-label="实验记录索引" className="lab-observatory-index">
              {labExperiments.map((experiment, index) => (
                <li className={index === activeIndex ? "is-active" : undefined} key={experiment.id}>
                  <button
                    aria-current={index === activeIndex ? "true" : undefined}
                    onClick={() => showExperiment(index)}
                    type="button"
                  >
                    <span className="lab-observatory-index-dot" />
                    <span className="lab-mono">EXP—{experiment.number}</span>
                    <strong>{experiment.name}</strong>
                  </button>
                </li>
              ))}
            </ol>
            <div aria-hidden="true" className="lab-observatory-progress">
              <span className="lab-mono">0{activeIndex + 1}</span>
              <span className="lab-observatory-progress-track">
                <motion.i
                  animate={{ scaleX: (activeIndex + 1) / labExperiments.length }}
                  transition={shouldReduceMotion ? { duration: 0 } : { damping: 20, stiffness: 260, type: "spring" }}
                />
              </span>
              <span className="lab-mono">0{labExperiments.length}</span>
            </div>
          </div>

          <div
            aria-label="实验观测卡片，可使用左右方向键切换"
            className="lab-observatory-stage"
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") showExperiment(activeIndex - 1);
              if (event.key === "ArrowRight") showExperiment(activeIndex + 1);
            }}
            role="region"
            tabIndex={0}
          >
            <span aria-hidden="true" className="lab-observatory-feed lab-mono">DRAG / SWIPE TO EXPLORE</span>
            <div className="lab-observatory-panels">
              {labExperiments.map((experiment, index) => (
                <motion.article
                  animate={
                    index < activeIndex
                      ? { borderRadius: 26, opacity: 0, rotateZ: -7, scale: 0.88, x: "-112%", y: 0, z: 80 }
                      : index === activeIndex
                        ? { borderRadius: 26, opacity: 1, rotateX: 0, rotateZ: 0, scale: 1, x: 0, y: 0, z: 0 }
                        : {
                            borderRadius: 26,
                            opacity: Math.max(0.22, 0.52 - (index - activeIndex) * 0.12),
                            rotateX: (index - activeIndex) * -3,
                            rotateZ: (index - activeIndex) * 0.8,
                            scale: 1 - (index - activeIndex) * 0.055,
                            x: (index - activeIndex) * 24,
                            y: (index - activeIndex) * 22,
                            z: (index - activeIndex) * -120,
                          }
                  }
                  aria-label={`观测 ${experiment.number}：${experiment.name}`}
                  aria-hidden={index !== activeIndex}
                  className="lab-observatory-panel"
                  data-experiment-card
                  drag={index === activeIndex && !shouldReduceMotion ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.18}
                  dragMomentum={false}
                  onDragEnd={handleDragEnd}
                  key={experiment.id}
                  style={{
                    pointerEvents: index === activeIndex ? "auto" : "none",
                    zIndex: labExperiments.length - Math.abs(index - activeIndex),
                  }}
                  transition={
                    shouldReduceMotion
                      ? { duration: 0 }
                      : { damping: 17, mass: 0.72, stiffness: 210, type: "spring" }
                  }
                  whileDrag={{ borderRadius: 36, rotateZ: -1.5, scaleX: 1.025, scaleY: 0.975 }}
                >
                  <div className="lab-observatory-panel-copy">
                    <div className="lab-observatory-panel-meta">
                      <span className="lab-experiment-number lab-mono">OBSERVATION / {experiment.number}</span>
                      <span className="lab-experiment-status lab-mono"><i /> {experiment.status}</span>
                    </div>
                    <h3>{experiment.name}</h3>
                    <p>{experiment.summary}</p>
                    <div className="lab-experiment-tags">
                      {experiment.tags.map((tag) => <span className="lab-mono" key={tag}>{tag}</span>)}
                    </div>
                  </div>
                  <div aria-hidden="true" className="lab-observatory-card-visual">
                    <div className="lab-observatory-grid" />
                    <div className={`lab-observatory-signal lab-observatory-signal-${index + 1}`}>
                      <span />
                      <span />
                      <i />
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
