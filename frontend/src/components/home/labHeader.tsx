"use client";

import { useEffect, useRef, useState } from "react";
import { labNavigation } from "@/lib/labHomeContent";
import { gsap, useGSAP } from "@/lib/gsap";

export function LabHeader() {
  const [scrolled, setScrolled] = useState(false);
  const progressRef = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const progress = progressRef.current;
    if (!progress) return;

    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(
        progress,
        { scaleX: 0 },
        {
          ease: "none",
          scaleX: 1,
          scrollTrigger: {
            end: "bottom bottom",
            scrub: 0.2,
            start: "top top",
            trigger: document.documentElement,
          },
        },
      );
    });

    return () => media.revert();
  });

  // 使用原生 scroll 事件驱动 scrolled 状态，避免 Motion useScroll 依赖
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 28);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={scrolled ? "lab-header lab-header-scrolled" : "lab-header"}>
      <div className="lab-shell lab-header-inner">
        <a className="lab-brand" href="#home" aria-label="Crescent Lab 首页">
          <span aria-hidden="true" className="lab-crescent-mark" />
          <span>CRESCENT LAB</span>
        </a>
        <nav aria-label="主导航" className="lab-nav">
          {labNavigation.map((item) => (
            <a href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
        <span className="lab-header-signal lab-mono">
          <i /> ONLINE
        </span>
      </div>
      <span aria-hidden="true" className="lab-scroll-progress" ref={progressRef} />
    </header>
  );
}
