"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import BlurText from "@/components/BlurText";
import { fadeUp, scaleIn, stagger } from "@/components/home/motionConfig";
import { CrescentCore } from "@/components/home/crescentCore";

export function LabHero() {
  return (
    <section className="lab-hero lab-shell">
      <motion.div animate="visible" className="lab-hero-copy" initial="hidden" variants={stagger}>
        <motion.p className="lab-kicker lab-mono" variants={fadeUp}>独立研究 / 构建日志</motion.p>
        <motion.h1 variants={fadeUp}>
          <BlurText animateBy="words" delay={140} direction="bottom" text="CRESCENT LAB" />
        </motion.h1>
        <motion.p className="lab-hero-manifesto" variants={fadeUp}>构建想法。运行实验。发布留存成果。</motion.p>
        <motion.p className="lab-hero-description" variants={fadeUp}>
          一个持续运转的个人技术实验室。这里收录正在构建的产品、开源实验、工程笔记，以及那些仍需要被证明的想法。
        </motion.p>
        <motion.div className="lab-hero-actions" variants={fadeUp}>
          <Link className="lab-button lab-button-primary" href="/building">
            查看正在构建 <ArrowRight size={16} />
          </Link>
          <Link className="lab-button lab-button-quiet" href="/notes">
            阅读田野笔记
          </Link>
        </motion.div>
        <motion.dl className="lab-hero-readout" variants={fadeUp}>
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
        animate="visible"
        aria-label="抽象月牙核心静态预览"
        className="lab-hero-visual"
        initial="hidden"
        variants={scaleIn}
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
