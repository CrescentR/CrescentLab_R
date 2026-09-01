"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { fadeUp, scaleIn, stagger } from "@/components/home/motionConfig";

const routes = [
  { href: "/updates", index: "01", label: "动态", tone: "acid" },
  { href: "/projects", index: "02", label: "项目", tone: "blue" },
  { href: "/notes", index: "03", label: "笔记", tone: "orange" },
  { href: "/about", index: "04", label: "关于", tone: "paper" },
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
          <span>INDEX</span>
        </motion.h1>
        <motion.p className="lab-hero-manifesto" variants={fadeUp}>
          记录进展。<br />整理方法。<br />分享成果。
        </motion.p>
        <motion.p className="lab-hero-description" variants={fadeUp}>
          一个持续更新的个人站点。这里收录项目进展、过程记录和工程笔记，也保留尚未写成完整文章的思考。
        </motion.p>
        <motion.div className="lab-hero-actions" variants={fadeUp}>
          <Link className="lab-button lab-button-primary" href="/updates">
            查看最新动态 <ArrowRight aria-hidden="true" size={17} />
          </Link>
          <Link className="lab-button lab-button-quiet" href="/about">
            这是什么
          </Link>
        </motion.div>
      </motion.div>

      <motion.aside animate="visible" className="lab-hero-visual" initial="hidden" variants={scaleIn}>
        <div className="lab-hero-poster">
          <span className="lab-mono">OPEN FILE / 001</span>
          <strong>MAKE<br />REFINE<br />SHARE</strong>
          <i aria-hidden="true">CI</i>
          <p>UTC+08 / SELF HOSTED / CONTINUOUSLY UPDATED</p>
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
