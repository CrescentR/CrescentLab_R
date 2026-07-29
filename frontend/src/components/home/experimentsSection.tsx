"use client";

import { useState } from "react";
import { motion, type PanInfo, useReducedMotion } from "motion/react";
import { labExperiments } from "@/lib/labHomeContent";
import { SectionIntro } from "@/components/home/sectionIntro";

type DragDirection = -1 | 0 | 1;

export function ExperimentsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragDirection, setDragDirection] = useState<DragDirection>(0);
  const [isDragging, setIsDragging] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const showExperiment = (index: number) => {
    if (index < 0 || index >= labExperiments.length || index === activeIndex) return;
    setActiveIndex(index);
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    setDragDirection(0);

    const swipeDistance = info.offset.x + info.velocity.x * 0.12;
    if (swipeDistance < -80) {
      showExperiment(activeIndex + 1);
    } else if (swipeDistance > 80) {
      showExperiment(activeIndex - 1);
    }
  };

  const previewIndex = activeIndex + (dragDirection < 0 ? 1 : -1);

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
              {labExperiments.map((experiment, index) => {
                const isPreview = isDragging && dragDirection !== 0 && index === previewIndex;

                return (
                  <motion.article
                    animate={getCardAnimation(index, activeIndex, isPreview, dragDirection)}
                    aria-label={`观测 ${experiment.number}：${experiment.name}`}
                    aria-hidden={index !== activeIndex}
                    className="lab-observatory-panel"
                    data-active={index === activeIndex ? "true" : undefined}
                    data-experiment-card
                    drag={index === activeIndex && !shouldReduceMotion ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    dragMomentum={false}
                    onDrag={(_event, info) => {
                      const nextDirection = info.offset.x < -8 ? -1 : info.offset.x > 8 ? 1 : 0;
                      if (nextDirection !== dragDirection) setDragDirection(nextDirection);
                    }}
                    onDragEnd={handleDragEnd}
                    onDragStart={() => setIsDragging(true)}
                    key={experiment.id}
                    style={{
                      pointerEvents: index === activeIndex ? "auto" : "none",
                      zIndex: labExperiments.length - Math.abs(index - activeIndex),
                    }}
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { damping: 15, mass: 0.78, stiffness: 190, type: "spring" }
                    }
                    whileDrag={{
                      borderRadius: dragDirection < 0
                        ? "42px 22px 34px 46px"
                        : "22px 42px 46px 34px",
                      rotateZ: dragDirection * 1.6,
                      scaleX: 1.045,
                      scaleY: 0.955,
                    }}
                    whileHover={shouldReduceMotion ? undefined : { borderRadius: 32, scale: 1.006 }}
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
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function getCardAnimation(
  index: number,
  activeIndex: number,
  isPreview: boolean,
  dragDirection: DragDirection,
) {
  if (isPreview) {
    return {
      borderRadius: 34,
      opacity: 0.68,
      rotateX: -2,
      rotateZ: dragDirection * 1.2,
      scale: 0.965,
      x: dragDirection < 0 ? 18 : -18,
      y: 16,
      z: -70,
    };
  }

  if (index < activeIndex) {
    return { borderRadius: 26, opacity: 0, rotateZ: -7, scale: 0.88, x: "-112%", y: 0, z: 80 };
  }

  if (index === activeIndex) {
    return { borderRadius: 26, opacity: 1, rotateX: 0, rotateZ: 0, scale: 1, x: 0, y: 0, z: 0 };
  }

  const depth = index - activeIndex;
  return {
    borderRadius: 26,
    opacity: Math.max(0.22, 0.52 - depth * 0.12),
    rotateX: depth * -3,
    rotateZ: depth * 0.8,
    scale: 1 - depth * 0.055,
    x: depth * 24,
    y: depth * 22,
    z: depth * -120,
  };
}
