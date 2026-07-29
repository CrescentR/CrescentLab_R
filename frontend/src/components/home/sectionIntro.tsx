"use client";

import { motion } from "motion/react";
import { fadeUp } from "@/components/home/motionConfig";

export function SectionIntro({
  index,
  title,
  description,
}: {
  index: string;
  title: string;
  description: string;
}) {
  return (
    <motion.header className="lab-section-intro" variants={fadeUp}>
      <span className="lab-mono lab-section-index">{index}</span>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </motion.header>
  );
}
