"use client";

import { Code2, Mail } from "lucide-react";
import { motion } from "motion/react";
import { revealItem, viewportOnce } from "@/components/home/motionConfig";

export function LabFooter() {
  return (
    <footer className="lab-footer" id="about">
      <div className="lab-footer-orbit" aria-hidden="true"><span /></div>
      <motion.div className="lab-shell lab-footer-inner" initial="hidden" variants={revealItem} viewport={viewportOnce} whileInView="visible">
        <div className="lab-footer-brand">
          <span aria-hidden="true" className="lab-crescent-mark" />
          <div>
            <strong>CRESCENT LAB</strong>
            <p>Independent digital research practice.</p>
          </div>
        </div>
        <p className="lab-footer-note">Built after dark. Documented before it disappears.</p>
        <div aria-label="External contacts" className="lab-footer-links">
          <span><Code2 size={16} /> GitHub</span>
          <span><Mail size={16} /> Contact</span>
        </div>
      </motion.div>
    </footer>
  );
}
