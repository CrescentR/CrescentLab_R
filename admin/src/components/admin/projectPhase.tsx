import type { ProjectListItem } from "@/lib/api/projects";

export type ProjectPhase = ProjectListItem["phase"];

// 与公开站 frontend/src/lib/journal.ts 的 projectPhases 保持同一套名称与说明。
export const projectPhases = [
  { value: "research", moon: 0, name: "新月", label: "研究中", hint: "验证问题是否值得做" },
  { value: "building", moon: 0.25, name: "上弦", label: "构建中", hint: "边界确定，持续开发" },
  { value: "live", moon: 0.5, name: "满月", label: "已上线", hint: "稳定可用，按反馈迭代" },
  { value: "waning", moon: 0.75, name: "下弦", label: "收尾", hint: "维护、归档或放弃" },
] as const;

export function MoonGlyph({ phase, size = 16 }: { phase: number; size?: number }) {
  const radius = size / 2 - 1;
  const center = size / 2;
  const cosine = Math.cos(phase * 2 * Math.PI);
  const waxing = phase < 0.5;
  const innerSweep = waxing ? (cosine > 0 ? 0 : 1) : (cosine > 0 ? 1 : 0);
  const lit = `M${center},${center - radius} A${radius},${radius} 0 0 ${waxing ? 1 : 0} ${center},${center + radius} A${Math.abs(cosine) * radius},${radius} 0 0 ${innerSweep} ${center},${center - radius}Z`;
  return (
    <svg aria-hidden="true" className="project-moon" height={size} viewBox={`0 0 ${size} ${size}`} width={size}>
      <circle cx={center} cy={center} fill="none" opacity=".45" r={radius} stroke="currentColor" strokeWidth="1.2" />
      <path d={lit} fill="currentColor" />
    </svg>
  );
}
