"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { fadeUp, scaleIn, stagger } from "@/components/home/motionConfig";

const routes = [
  { href: "/building", index: "01", label: "正在构建", tone: "acid" },
  { href: "/experiments", index: "02", label: "实验观测", tone: "blue" },
  { href: "/projects", index: "03", label: "项目", tone: "orange" },
  { href: "/notes", index: "04", label: "笔记", tone: "paper" },
] as const;

export function LabHero() {
  return (
    <section className="lab-hero lab-shell">
      <div aria-hidden="true" className="lab-hero-grid" />

      <motion.div animate="visible" className="lab-hero-copy" initial="hidden" variants={stagger}>
        <motion.p className="lab-kicker lab-mono" variants={fadeUp}>
          <span>LIVE</span>
          INDEPENDENT DIGITAL PRACTICE
        </motion.p>
        <motion.h1 variants={fadeUp}>
          <span>CRESCENT</span>
          <span>LAB</span>
        </motion.h1>
        <motion.p className="lab-hero-manifesto" variants={fadeUp}>
          构建想法。<br />运行实验。<br />发布留存成果。
        </motion.p>
        <motion.p className="lab-hero-description" variants={fadeUp}>
          一个持续运转的个人技术实验室。这里收录正在构建的产品、开源实验、工程笔记，以及仍需要被证明的想法。
        </motion.p>
        <motion.div className="lab-hero-actions" variants={fadeUp}>
          <Link className="lab-button lab-button-primary" href="/building">
            进入实验室 <ArrowRight aria-hidden="true" size={17} />
          </Link>
          <Link className="lab-button lab-button-quiet" href="/about">
            这是什么
          </Link>
        </motion.div>
      </motion.div>

      <motion.aside animate="visible" className="lab-hero-visual" initial="hidden" variants={scaleIn}>
        <div className="lab-hero-poster">
          <span className="lab-mono">OPEN FILE / 001</span>
          <strong>BUILD<br />OBSERVE<br />PUBLISH</strong>
          <i aria-hidden="true">CL</i>
          <p>UTC+08 / SELF HOSTED / ALWAYS IN PROGRESS</p>
        </div>
      </motion.aside>

      <motion.nav aria-label="公开内容入口" className="lab-hero-routes" initial="hidden" variants={stagger} whileInView="visible">
        {routes.map((route) => (
          <motion.div key={route.href} variants={fadeUp}>
            <Link className={`lab-hero-route lab-hero-route-${route.tone}`} href={route.href}>
              <span className="lab-mono">{route.index}</span>
              <strong>{route.label}</strong>
              <ArrowDownRight aria-hidden="true" size={24} />
            </Link>
          </motion.div>
        ))}
      </motion.nav>
    </section>
  );
}
