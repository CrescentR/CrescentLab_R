"use client";

import { useEffect, useState } from "react";
import { motion, type PanInfo, useReducedMotion } from "motion/react";
import { listPublicObservatoryNotes, type ObservatoryNoteItem } from "@/lib/api/observatory";
import { SectionIntro } from "@/components/home/sectionIntro";

type DragDirection = -1 | 0 | 1;

const statusLabel: Record<string, string> = {
  active: "进行中",
  resolved: "已解决",
  abandoned: "已放弃",
};

export function ExperimentsSection() {
  const [notes, setNotes] = useState<ObservatoryNoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragDirection, setDragDirection] = useState<DragDirection>(0);
  const [isDragging, setIsDragging] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const result = await listPublicObservatoryNotes({ page_size: 12 });
        if (!active) return;
        setNotes(result.items);
      } catch {
        if (active) setLoadError("观测记录加载失败，请稍后重试。");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const showExperiment = (index: number) => {
    if (index < 0 || index >= notes.length || index === activeIndex) return;
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
    <section className="lab-section">
      <div className="lab-shell">
        <SectionIntro
          description="开发过程和技术问题中形成的阶段记录。重点不是罗列工作，而是说明过程中知道了什么。"
          index="02 / 动态"
          title="过程记录"
        />

        {loading ? (
          <p className="lab-empty-copy">正在读取过程记录…</p>
        ) : loadError ? (
          <p className="lab-empty-copy">{loadError}</p>
        ) : notes.length === 0 ? (
          <p className="lab-empty-copy">还没有公开的过程记录。有明确的新信息时再写进来。</p>
        ) : (
          <div className="lab-observatory">
            <div className="lab-observatory-rail">
              <ol aria-label="过程记录索引" className="lab-observatory-index">
                {notes.map((note, index) => (
                  <li className={index === activeIndex ? "is-active" : undefined} key={note.id}>
                    <button
                      aria-current={index === activeIndex ? "true" : undefined}
                      onClick={() => showExperiment(index)}
                      type="button"
                    >
                      <span className="lab-observatory-index-dot" />
                      <span className="lab-mono">OBS—{String(index + 1).padStart(3, "0")}</span>
                      <strong>{note.title}</strong>
                    </button>
                  </li>
                ))}
              </ol>
              <div aria-hidden="true" className="lab-observatory-progress">
                <span className="lab-mono">{String(activeIndex + 1).padStart(2, "0")}</span>
                <span className="lab-observatory-progress-track">
                  <motion.i
                    animate={{ scaleX: (activeIndex + 1) / notes.length }}
                    transition={shouldReduceMotion ? { duration: 0 } : { damping: 20, stiffness: 260, type: "spring" }}
                  />
                </span>
                <span className="lab-mono">{String(notes.length).padStart(2, "0")}</span>
              </div>
            </div>

            <div
              aria-label="过程记录卡片，可使用左右方向键切换"
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
                {notes.map((note, index) => {
                  const isPreview = isDragging && dragDirection !== 0 && index === previewIndex;
                  const number = String(index + 1).padStart(3, "0");
                  return (
                    <motion.article
                      animate={getCardAnimation(index, activeIndex, isPreview, dragDirection)}
                      aria-hidden={index !== activeIndex}
                      aria-label={`记录 ${number}：${note.title}`}
                      className="lab-observatory-panel"
                      data-experiment-card
                      drag={index === activeIndex && !shouldReduceMotion ? "x" : false}
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.2}
                      dragMomentum={false}
                      key={note.id}
                      onDrag={(_event, info) => {
                        const nextDirection = info.offset.x < -8 ? -1 : info.offset.x > 8 ? 1 : 0;
                        if (nextDirection !== dragDirection) setDragDirection(nextDirection);
                      }}
                      onDragEnd={handleDragEnd}
                      onDragStart={() => setIsDragging(true)}
                      style={{
                        pointerEvents: index === activeIndex ? "auto" : "none",
                        zIndex: notes.length - Math.abs(index - activeIndex),
                      }}
                      transition={
                        shouldReduceMotion
                          ? { duration: 0 }
                          : { damping: 15, mass: 0.78, stiffness: 190, type: "spring" }
                      }
                      whileDrag={{
                        borderRadius: 8,
                        rotateZ: dragDirection * 1.6,
                        scaleX: 1.045,
                        scaleY: 0.955,
                      }}
                      whileHover={shouldReduceMotion ? undefined : { scale: 1.006 }}
                    >
                      <div className="lab-observatory-panel-copy">
                        <div className="lab-observatory-panel-meta">
                          <span className="lab-experiment-number lab-mono">NOTE / {number}</span>
                          <span className="lab-experiment-status lab-mono"><i /> {statusLabel[note.status] ?? note.status}</span>
                        </div>
                        <h3>{note.title}</h3>
                        {note.question && note.question !== note.title && <p>{note.question}</p>}
                        {note.observation && <p>{note.observation}</p>}
                        {(note.conclusion || note.next_step) && (
                          <p>{note.conclusion || `下一步：${note.next_step}`}</p>
                        )}
                        {note.tags.length > 0 && (
                          <div className="lab-experiment-tags">
                            {note.tags.map((tag) => <span className="lab-mono" key={tag}>{tag}</span>)}
                          </div>
                        )}
                      </div>
                      <div aria-hidden="true" className="lab-observatory-card-visual">
                        <div className="lab-observatory-grid" />
                        <div className={`lab-observatory-signal lab-observatory-signal-${(index % 3) + 1}`}>
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
        )}
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
      borderRadius: 8,
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
    return { borderRadius: 8, opacity: 0, rotateZ: -7, scale: 0.88, x: "-112%", y: 0, z: 80 };
  }

  if (index === activeIndex) {
    return { borderRadius: 8, opacity: 1, rotateX: 0, rotateZ: 0, scale: 1, x: 0, y: 0, z: 0 };
  }

  const depth = index - activeIndex;
  return {
    borderRadius: 8,
    opacity: Math.max(0.22, 0.52 - depth * 0.12),
    rotateX: depth * -3,
    rotateZ: depth * 0.8,
    scale: 1 - depth * 0.055,
    x: depth * 24,
    y: depth * 22,
    z: depth * -120,
  };
}
