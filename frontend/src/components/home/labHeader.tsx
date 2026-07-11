"use client";

import { useState } from "react";
import { useMotionValueEvent, useScroll } from "motion/react";
import { labNavigation } from "@/lib/labHomeContent";

export function LabHeader() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => setScrolled(latest > 28));

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
    </header>
  );
}
