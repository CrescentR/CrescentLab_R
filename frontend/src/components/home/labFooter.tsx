"use client";

import { Code2, Mail } from "lucide-react";
import { motion } from "motion/react";
import { fadeUp, viewport } from "@/components/home/motionConfig";

export function LabFooter() {
  return (
    <footer className="lab-footer" id="about">
      <div className="lab-footer-orbit" aria-hidden="true"><span /></div>
      <motion.div className="lab-shell lab-footer-inner" initial="hidden" variants={fadeUp} viewport={viewport} whileInView="visible">
        <div className="lab-footer-brand">
          <span aria-hidden="true" className="lab-crescent-mark" />
          <div>
            <strong>CRESCENT LAB</strong>
            <p>独立的数字研究实践。</p>
          </div>
        </div>
        <p className="lab-footer-note">深夜构建。在消失之前记录。</p>
        <div aria-label="External contacts" className="lab-footer-links">
          <span><Code2 size={16} /> GitHub</span>
          <span><Mail size={16} /> 联系方式</span>
        </div>
      </motion.div>
    </footer>
  );
}
