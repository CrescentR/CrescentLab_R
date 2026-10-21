"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { fadeUp, scaleIn, stagger } from "@/components/home/motionConfig";

export function LabHero() {
  return (
    <section className="lab-hero lab-shell">
      <motion.div animate="visible" className="lab-hero-copy" initial="hidden" variants={stagger}>
        <motion.p className="lab-kicker lab-mono" variants={fadeUp}>
          <span>LIVE</span>
          INDEPENDENT DIGITAL PRACTICE
        </motion.p>
        <motion.h1 variants={fadeUp}>
          <span>Crescent</span>
          <span>Index</span>
        </motion.h1>
        <motion.p className="lab-hero-manifesto" variants={fadeUp}>
          <span>记录进展</span>
          <span>整理方法</span>
          <span>分享成果</span>
        </motion.p>
        <motion.p className="lab-hero-description" variants={fadeUp}>
          一个持续更新的个人站点。这里收录项目进展、过程记录和工程笔记，也保留尚未写成完整文章的思考。
        </motion.p>
        <motion.div className="lab-hero-actions" variants={fadeUp}>
          <Link className="lab-button lab-button-primary" href="/updates">
            查看最新动态 <ArrowRight aria-hidden="true" size={17} />
          </Link>
          <Link className="lab-button lab-button-quiet" href="/about">
            关于这个站点
          </Link>
        </motion.div>
      </motion.div>

      <motion.aside aria-hidden="true" animate="visible" className="lab-hero-visual" initial="hidden" variants={scaleIn}>
        <div className="lab-hero-poster">
          <span className="lab-mono"><span>OPEN FILE / 001</span><span>2026</span></span>
          <strong>MAKE<br />REFINE<br />SHARE</strong>
          <i aria-hidden="true">CI</i>
          <p>
            <span>UTC+08</span>
            <span>SELF-HOSTED</span>
            <span>ALWAYS ON</span>
          </p>
        </div>
      </motion.aside>
    </section>
  );
}
