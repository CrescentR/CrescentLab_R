// 与设计稿一致：以 2000-01-06 18:14 UTC 新月为基准计算朔望月相。
export function lunarPhase(timestamp: number): number {
  const period = 29.530588853;
  const days = (timestamp - Date.UTC(2000, 0, 6, 18, 14)) / 86_400_000;
  return ((days % period + period) % period) / period;
}

export function lunarPhaseName(phase: number): string {
  const names = ["新月", "娥眉月", "上弦月", "盈凸月", "满月", "亏凸月", "下弦月", "残月"];
  return names[Math.round(phase * 8) % 8];
}

export function lunarPath(phase: number, size: number): string {
  const radius = size / 2 - 1;
  const center = size / 2;
  const cosine = Math.cos(phase * 2 * Math.PI);
  const waxing = phase < 0.5;
  const innerSweep = waxing ? (cosine > 0 ? 0 : 1) : (cosine > 0 ? 1 : 0);
  return `M${center},${center - radius} A${radius},${radius} 0 0 ${waxing ? 1 : 0} ${center},${center + radius} A${Math.abs(cosine) * radius},${radius} 0 0 ${innerSweep} ${center},${center - radius}Z`;
}
