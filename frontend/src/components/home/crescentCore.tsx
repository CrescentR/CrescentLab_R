"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useReducedMotion, useScroll } from "motion/react";

const CrescentScene = dynamic(
  () => import("@/components/home/crescentScene").then((module) => module.CrescentScene),
  { ssr: false },
);

export function CrescentCore() {
  const shouldReduceMotion = useReducedMotion();
  const [supportsWebGLCore, setSupportsWebGLCore] = useState(false);
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    const desktopPointer = window.matchMedia("(min-width: 768px) and (pointer: fine)");
    const update = () => setSupportsWebGLCore(desktopPointer.matches && !shouldReduceMotion);
    update();
    desktopPointer.addEventListener("change", update);
    return () => desktopPointer.removeEventListener("change", update);
  }, [shouldReduceMotion]);

  if (!supportsWebGLCore) {
    return <div aria-hidden="true" className="lab-core-static" data-core-mode="static" />;
  }

  return (
    <div aria-hidden="true" className="lab-core-canvas" data-core-mode="webgl">
      <CrescentScene scrollProgress={scrollYProgress} />
    </div>
  );
}
