"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Box, Orbit, Sparkles, TerminalSquare } from "lucide-react";
import { motion } from "motion/react";
import { listPublicBuilds, type BuildItem, type BuildStage } from "@/lib/api/builds";
import { SectionIntro } from "@/components/home/sectionIntro";
import { cardHover, fadeUp, stagger, viewport } from "@/components/home/motionConfig";

const icons = [Box, TerminalSquare, Sparkles, Orbit] as const;
const tones = ["sage", "blue", "clay", "stone"] as const;

const stageLabel: Record<BuildStage, string> = {
  prototype: "原型",
  development: "开发",
  validating: "验证",
  beta: "内测",
  paused: "暂停",
};

export function NowBuildingSection() {
  const [builds, setBuilds] = useState<BuildItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const result = await listPublicBuilds({ page_size: 4 });
        if (!active) return;
        setBuilds(result.items);
      } catch {
        if (active) setLoadError("近期进展加载失败，请稍后重试。");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <motion.section
      className="lab-section lab-shell"
      initial="hidden"
      variants={stagger}
      viewport={viewport}
      whileInView="visible"
    >
      <SectionIntro
        description="当前投入时间、近期会继续推进的工作。没有新进展就不展示。"
        index="01 / 动态"
        title="近期进展"
      />
      {loading ? (
        <p className="lab-empty-copy">正在读取近期进展…</p>
      ) : loadError ? (
        <p className="lab-empty-copy">{loadError}</p>
      ) : builds.length === 0 ? (
        <p className="lab-empty-copy">目前没有公开的近期进展。</p>
      ) : (
        <div className="lab-bento-grid">
          {builds.map((build, index) => {
            const Icon = icons[index % icons.length];
            const tone = tones[index % tones.length];
            const href = build.detail_url || build.demo_url || build.repo_url;
            const mark = build.name.replace(/\s+/g, "").slice(0, 2).toUpperCase();
            return (
              <motion.article
                className={`lab-build-card lab-build-card-${tone}`}
                key={build.id}
                variants={fadeUp}
                {...cardHover}
              >
                <div className="lab-build-card-head">
                  <span className="lab-build-index lab-mono">UPDATE / {String(index + 1).padStart(2, "0")}</span>
                  {href ? (
                    <a aria-label={`${build.name} 入口`} href={href} rel="noreferrer" target={href.startsWith("http") ? "_blank" : undefined}>
                      <ArrowUpRight size={17} />
                    </a>
                  ) : (
                    <span aria-hidden="true"><ArrowUpRight size={17} /></span>
                  )}
                </div>
                <div className="lab-build-visual" aria-hidden="true">
                  <Icon size={index === 0 ? 38 : 30} strokeWidth={1.25} />
                  <span>{mark}</span>
                </div>
                <div>
                  <p className="lab-build-status lab-mono"><i /> {stageLabel[build.stage]}</p>
                  <h3>{build.name}</h3>
                  {build.one_liner && <p className="lab-build-oneliner">{build.one_liner}</p>}
                  {(build.latest_progress || build.next_step) && (
                    <p className="lab-build-progress">{build.latest_progress || `下一步：${build.next_step}`}</p>
                  )}
                  {build.progressed_at && (
                    <p className="lab-build-updated lab-mono">{formatDate(build.progressed_at)}</p>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </motion.section>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("zh-CN", { year: "numeric", month: "short", day: "numeric" });
}
