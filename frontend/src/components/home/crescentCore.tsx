"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const CrescentScene = dynamic(
  () => import("@/components/home/crescentScene").then((module) => module.CrescentScene),
  { ssr: false },
);

function canUseWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function CrescentCore() {
  const [supportsWebGLCore, setSupportsWebGLCore] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const update = () => setSupportsWebGLCore(desktop.matches && canUseWebGL());
    update();
    desktop.addEventListener("change", update);
    return () => desktop.removeEventListener("change", update);
  }, []);

  if (!supportsWebGLCore) {
    return (
      <div aria-hidden="true" className="lab-core-static" data-core-mode="static">
        <span className="lab-core-static-crescent" />
        <span className="lab-core-static-bead" />
      </div>
    );
  }

  return (
    <div aria-hidden="true" className="lab-core-canvas" data-core-mode="webgl">
      <CrescentScene />
    </div>
  );
}
