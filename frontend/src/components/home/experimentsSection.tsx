"use client";

import { useRef } from "react";
import { labExperiments } from "@/lib/labHomeContent";
import { gsap, useGSAP } from "@/lib/gsap";
import { SectionIntro } from "@/components/home/sectionIntro";

export function ExperimentsSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      const panels = gsap.utils.toArray<HTMLElement>("[data-experiment-panel]", section);
      const indexItems = gsap.utils.toArray<HTMLElement>("[data-experiment-index]", section);
      const indexDots = gsap.utils.toArray<HTMLElement>("[data-experiment-index-dot]", section);
      const signals = gsap.utils.toArray<HTMLElement>("[data-experiment-signal]", section);
      const progressFill = section.querySelector<HTMLElement>("[data-experiment-progress]");
      const media = gsap.matchMedia();

      media.add(
        "(min-width: 981px) and (min-height: 720px) and (prefers-reduced-motion: no-preference)",
        () => {
          if (!progressFill) return;

          gsap.set(panels.slice(1), { autoAlpha: 0, y: 28 });
          gsap.set(indexItems[0], { autoAlpha: 1, x: 8 });
          gsap.set(indexItems.slice(1), { autoAlpha: 0.38, x: 0 });
          gsap.set(indexDots[0], { scale: 1 });
          gsap.set(indexDots.slice(1), { scale: 0.6 });
          gsap.set(signals.slice(1), { autoAlpha: 0, rotation: -8, scale: 0.92 });
          gsap.set(progressFill, { scaleX: 0, transformOrigin: "left center" });

          const timeline = gsap.timeline({
            defaults: { duration: 0.42, ease: "power2.inOut" },
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: () => `+=${window.innerHeight * 2.4}`,
              invalidateOnRefresh: true,
              pin: true,
              scrub: 0.7,
            },
          });

          timeline.addLabel("experiment-1", 0);

          for (let index = 1; index < panels.length; index += 1) {
            const position = index;
            timeline
              .addLabel(`experiment-${index + 1}`, position)
              .to(panels[index - 1], { autoAlpha: 0, y: -28, duration: 0.34 }, position - 0.22)
              .to(signals[index - 1], { autoAlpha: 0, rotation: 8, scale: 1.08 }, position - 0.22)
              .to(indexItems[index - 1], { autoAlpha: 0.38, x: 0, duration: 0.26 }, position - 0.16)
              .to(indexDots[index - 1], { scale: 0.6, duration: 0.26 }, position - 0.16)
              .fromTo(
                panels[index],
                { autoAlpha: 0, y: 28 },
                { autoAlpha: 1, duration: 0.46, immediateRender: false, y: 0 },
                position,
              )
              .fromTo(
                signals[index],
                { autoAlpha: 0, rotation: -8, scale: 0.92 },
                { autoAlpha: 1, duration: 0.5, immediateRender: false, rotation: 0, scale: 1 },
                position,
              )
              .to(indexItems[index], { autoAlpha: 1, x: 8, duration: 0.3 }, position)
              .to(indexDots[index], { scale: 1, duration: 0.3 }, position);
          }

          timeline.to(progressFill, { duration: 2.55, ease: "none", scaleX: 1 }, 0);
        },
        section,
      );

      media.add(
        "(prefers-reduced-motion: no-preference) and ((max-width: 980px) or (max-height: 719px))",
        () => {
          panels.forEach((panel) => {
            gsap.from(panel, {
              autoAlpha: 0,
              duration: 0.55,
              ease: "power2.out",
              scrollTrigger: {
                trigger: panel,
                start: "top 88%",
                once: true,
              },
              y: 20,
            });
          });
        },
        section,
      );

      return () => media.revert();
    },
    { scope: sectionRef },
  );

  return (
    <section className="lab-section lab-experiments" id="experiments" ref={sectionRef}>
      <div className="lab-shell">
        <SectionIntro
          description="来自受控失败、未完成工具和技术问题的笔记。"
          index="02 / 归档"
          title="实验观测台"
        />

        <div className="lab-observatory">
          <ol aria-label="实验记录索引" className="lab-observatory-index">
            {labExperiments.map((experiment) => (
              <li data-experiment-index key={experiment.id}>
                <span className="lab-observatory-index-dot" data-experiment-index-dot />
                <span className="lab-mono">EXP—{experiment.number}</span>
                <strong>{experiment.name}</strong>
              </li>
            ))}
            <li aria-hidden="true" className="lab-observatory-progress">
              <span className="lab-mono">01</span>
              <span className="lab-observatory-progress-track">
                <i data-experiment-progress />
              </span>
              <span className="lab-mono">03</span>
            </li>
          </ol>

          <div className="lab-observatory-stage">
            <div aria-hidden="true" className="lab-observatory-visual">
              <div className="lab-observatory-grid" />
              <span className="lab-observatory-feed lab-mono">LIVE FEED / ARCHIVE</span>
              {labExperiments.map((experiment, index) => (
                <div
                  className={`lab-observatory-signal lab-observatory-signal-${index + 1}`}
                  data-experiment-signal
                  key={experiment.id}
                >
                  <span />
                  <span />
                  <i />
                </div>
              ))}
            </div>

            <div className="lab-observatory-panels">
              {labExperiments.map((experiment) => (
                <article className="lab-observatory-panel" data-experiment-panel key={experiment.id}>
                  <div className="lab-observatory-panel-meta">
                    <span className="lab-experiment-number lab-mono">OBSERVATION / {experiment.number}</span>
                    <span className="lab-experiment-status lab-mono"><i /> {experiment.status}</span>
                  </div>
                  <h3>{experiment.name}</h3>
                  <p>{experiment.summary}</p>
                  <div className="lab-experiment-tags">
                    {experiment.tags.map((tag) => <span className="lab-mono" key={tag}>{tag}</span>)}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
