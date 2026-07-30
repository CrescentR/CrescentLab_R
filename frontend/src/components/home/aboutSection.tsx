"use client";

import { motion } from "motion/react";
import { SectionIntro } from "@/components/home/sectionIntro";
import { fadeUp, stagger, viewport } from "@/components/home/motionConfig";

/** 四个内容区块各自承担的职责，与 PRD「首页内容主线」保持一致 */
const contentMap = [
  {
    section: "正在构建",
    duty: "现在把精力放在哪里。方向明确、结果未完成，天到数周的时间尺度。",
  },
  {
    section: "实验观测台",
    duty: "遇到了什么、验证后知道了什么。允许失败、变化和未决。",
  },
  {
    section: "项目",
    duty: "哪些成果已经形成稳定对象。目标和边界相对稳定，数月及以上。",
  },
  {
    section: "笔记",
    duty: "哪些结论值得完整阅读。已整理成可复用的表达，长期留存。",
  },
];

export function AboutSection() {
  return (
    <motion.section
      className="lab-section lab-shell"
      initial="hidden"
      variants={stagger}
      viewport={viewport}
      whileInView="visible"
    >
      <SectionIntro
        description="谁在维护这个站点，以及它按什么规则持续更新。"
        index="05 / 站点"
        title="关于"
      />

      <div className="lab-about-grid">
        <motion.article className="lab-about-card" variants={fadeUp}>
          <span className="lab-mono">IDENTITY</span>
          <h3>这是什么</h3>
          <p>
            CrescentLab 是一个自托管的个人技术实验室。它用一个公开站点承载正在构建的产品、开源实验和工程笔记，而不是一份简历或产品广告页。
          </p>
        </motion.article>
        <motion.article className="lab-about-card" variants={fadeUp}>
          <span className="lab-mono">PRINCIPLE</span>
          <h3>记录原则</h3>
          <p>
            每条内容优先提供事实、状态和结论，减少抽象口号。允许公开失败、放弃和限制，但必须说明原因或证据；内容失效时补充修订说明，不静默修改原结论。
          </p>
        </motion.article>
      </div>

      <motion.div className="lab-about-map" variants={fadeUp}>
        {contentMap.map((item) => (
          <div className="lab-about-map-row" key={item.section}>
            <strong>{item.section}</strong>
            <p>{item.duty}</p>
          </div>
        ))}
      </motion.div>
    </motion.section>
  );
}
