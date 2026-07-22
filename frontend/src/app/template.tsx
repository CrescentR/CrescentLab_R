"use client";

import { motion } from "motion/react";
import { duration, easing } from "@/components/home/motionConfig";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      animate={{ opacity: 1 }}
      initial={{ opacity: 0 }}
      transition={{ duration: duration.normal, ease: easing.standard }}
    >
      {children}
    </motion.div>
  );
}
