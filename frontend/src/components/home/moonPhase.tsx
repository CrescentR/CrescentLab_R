import { lunarPath } from "@/lib/moon";

export function MoonPhase({ phase, size = 18 }: { phase: number; size?: number }) {
  const center = size / 2;
  return (
    <svg aria-hidden="true" className="j-moon" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={center} cy={center} r={center - 1} fill="none" stroke="currentColor" strokeWidth="1.2" opacity=".45" />
      <path d={lunarPath(phase, size)} fill="currentColor" />
    </svg>
  );
}
