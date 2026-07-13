"use client";

import { ArrowDownRight } from "lucide-react";
import { motion } from "motion/react";
import { revealGroup, revealItem } from "@/components/home/motionConfig";
import { CrescentCore } from "@/components/home/crescentCore";

export function LabHero() {
  return (
    <section className="lab-hero lab-shell" id="home">
      <motion.div animate="visible" className="lab-hero-copy" initial="hidden" variants={revealGroup}>
        <motion.p className="lab-kicker lab-mono" variants={revealItem}>独立研究 / 构建日志</motion.p>
        <motion.h1 variants={revealItem}>CRESCENT LAB</motion.h1>
        <motion.p className="lab-hero-manifesto" variants={revealItem}>构建想法。运行实验。发布留存成果。</motion.p>
        <motion.p className="lab-hero-description" variants={revealItem}>
          一个持续运转的个人技术实验室。这里收录正在构建的产品、开源实验、工程笔记，以及那些仍需要被证明的想法。
        </motion.p>
        <motion.div className="lab-hero-actions" variants={revealItem}>
          <a className="lab-button lab-button-primary" href="#building">
            进入实验室 <ArrowDownRight size={16} />
          </a>
          <a className="lab-button lab-button-quiet" href="#notes">
            阅读田野笔记
          </a>
        </motion.div>
        <motion.dl className="lab-hero-readout" variants={revealItem}>
          <div>
            <dt>模式</dt>
            <dd>活跃研究</dd>
          </div>
          <div>
            <dt>关注点</dt>
            <dd>产品 / 系统</dd>
          </div>
          <div>
            <dt>时区</dt>
            <dd>UTC +08:00</dd>
          </div>
        </motion.dl>
      </motion.div>

      <motion.div
        animate={{ opacity: 1, scale: 1 }}
        aria-label="抽象月牙核心静态预览"
        className="lab-hero-visual"
        initial={{ opacity: 0, scale: 0.97 }}
        transition={{ delay: 0.18, duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="lab-core-grid" />
        <div className="lab-core-orbit lab-core-orbit-one" />
        <div className="lab-core-orbit lab-core-orbit-two" />
        <CrescentCore />
        <span className="lab-core-label lab-core-label-top lab-mono">CORE / 00</span>
        <span className="lab-core-label lab-core-label-bottom lab-mono">月球进程在线</span>
      </motion.div>
    </section>
  );
}
