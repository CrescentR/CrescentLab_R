"use client";

import {
  useEffect,
  useId,
  useRef,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import styles from "./LunarOrbit.module.css";

export type LunarOrbitProps = {
  className?: string;
  /** 组件边长（px），默认跟随容器宽度 */
  size?: number;
  /** 是否启用轻微鼠标视差；窄屏自动关闭 */
  interactive?: boolean;
  /** 强制关闭动画；未传时跟随系统 prefers-reduced-motion */
  reducedMotion?: boolean;
};

function subscribeReducedMotion(onChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

/**
 * 统一视觉中心（viewBox 400²）
 * 月牙略偏左，轨道均绕此中心旋转，形成完整引力场。
 */
const CX = 198;
const CY = 200;

export function LunarOrbit({
  className,
  size,
  interactive = true,
  reducedMotion,
}: LunarOrbitProps) {
  const reactId = useId().replace(/:/g, "");
  const maskId = `lunar-mask-${reactId}`;
  const gradientId = `lunar-grad-${reactId}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const systemReduced = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
  const motionOff = reducedMotion ?? systemReduced;

  useEffect(() => {
    if (!interactive || motionOff) return;

    const root = rootRef.current;
    if (!root) return;

    const finePointer = window.matchMedia("(pointer: fine)");
    if (!finePointer.matches) return;

    let frame = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let tracking = false;

    const apply = () => {
      root.style.setProperty("--lx", `${currentX.toFixed(2)}px`);
      root.style.setProperty("--ly", `${currentY.toFixed(2)}px`);
    };

    const tick = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      apply();
      if (
        tracking ||
        Math.abs(targetX - currentX) > 0.05 ||
        Math.abs(targetY - currentY) > 0.05
      ) {
        frame = requestAnimationFrame(tick);
      } else {
        frame = 0;
      }
    };

    const onMove = (event: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      targetX = Math.max(-1, Math.min(1, nx)) * 3.5;
      targetY = Math.max(-1, Math.min(1, ny)) * 2.5;
      tracking = true;
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const onLeave = () => {
      targetX = 0;
      targetY = 0;
      tracking = false;
      if (!frame) frame = requestAnimationFrame(tick);
    };

    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    return () => {
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
      root.style.setProperty("--lx", "0px");
      root.style.setProperty("--ly", "0px");
    };
  }, [interactive, motionOff]);

  const rootClass = [styles.root, motionOff ? styles.motionOff : "", className]
    .filter(Boolean)
    .join(" ");

  const style = (size ? { width: size, height: size } : undefined) as CSSProperties | undefined;

  return (
    <div aria-hidden="true" className={rootClass} ref={rootRef} style={style}>
      <svg className={styles.svg} fill="none" viewBox="0 0 400 400">
        <defs>
          <linearGradient id={gradientId} gradientTransform="rotate(128)" x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="var(--lunar-light)" />
            <stop offset="46%" stopColor="var(--lunar-main)" />
            <stop offset="100%" stopColor="var(--lunar-dark)" />
          </linearGradient>
          {/* 两圆相减：开口朝左 */}
          <mask id={maskId}>
            <rect fill="black" height="400" width="400" />
            <circle cx="186" cy="200" fill="white" r="68" />
            <circle cx="158" cy="190" fill="black" r="58" />
          </mask>
        </defs>

        {/* 点缀轨道：最外层椭圆弧（约 62% 可见） */}
        <g className={styles.orbitAccent}>
          <ellipse
            className={styles.accentStroke}
            cx={CX}
            cy={CY}
            rx="182"
            ry="122"
            stroke="var(--orbit-accent)"
            strokeDasharray="620 380"
            strokeDashoffset="40"
            strokeLinecap="round"
            strokeWidth="1.1"
            transform={`rotate(38 ${CX} ${CY})`}
          />
          <circle
            className={styles.nodeAccent}
            cx={CX + 148}
            cy={CY - 78}
            fill="var(--orbit-accent)"
            r="1.85"
            transform={`rotate(38 ${CX} ${CY})`}
          />
        </g>

        {/* 次轨道：完整椭圆，与主轨交叉 */}
        <g className={styles.orbitSecondary}>
          <ellipse
            cx={CX}
            cy={CY}
            rx="152"
            ry="152"
            stroke="var(--orbit-secondary)"
            strokeOpacity="0.26"
            strokeWidth="1.15"
            transform={`rotate(-32 ${CX} ${CY})`}
          />
        </g>

        {/* 主轨道：最清晰，少量缺口 */}
        <g className={styles.orbitPrimary}>
          <ellipse
            cx={CX}
            cy={CY}
            rx="168"
            ry="108"
            stroke="var(--orbit-primary)"
            strokeDasharray="780 95"
            strokeDashoffset="20"
            strokeLinecap="round"
            strokeOpacity="0.44"
            strokeWidth="1.35"
            transform={`rotate(-14 ${CX} ${CY})`}
          />
          <circle
            className={styles.nodePrimary}
            cx={CX - 152}
            cy={CY - 42}
            fill="var(--lunar-dark)"
            r="3.6"
            transform={`rotate(-14 ${CX} ${CY})`}
          />
        </g>

        {/* 月牙核心 */}
        <g className={styles.crescentShift}>
          <g className={styles.crescent}>
            <circle
              cx="186"
              cy="200"
              fill={`url(#${gradientId})`}
              mask={`url(#${maskId})`}
              r="68"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}
