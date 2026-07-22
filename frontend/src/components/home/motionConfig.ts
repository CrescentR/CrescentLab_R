import type { Variants } from "motion/react";

// ── 动效时长（秒） ──
export const duration = {
  fast: 0.18,
  normal: 0.32,
  slow: 0.64,
  slower: 0.96,
} as const;

// ── 缓动曲线 ──
export const easing = {
  standard: [0.22, 1, 0.36, 1] as const,
  enter: [0.16, 1, 0.3, 1] as const,
  exit: [0.4, 0, 1, 1] as const,
  emphasis: [0.34, 1.56, 0.64, 1] as const,
} as const;

// ── 入场 Variant ──

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: duration.slow, ease: easing.enter } },
};

export const fadeRight: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: { opacity: 1, x: 0, transition: { duration: duration.slow, ease: easing.enter } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.slow, ease: easing.enter } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: duration.normal, ease: easing.enter } },
};

export const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};

// ── 视口配置 ──
export const viewport = { once: true, amount: 0.2 } as const;

// ── 微交互 ──
export const buttonPress = {
  whileHover: { y: -2 },
  whileTap: { y: 0, scale: 0.98 },
  transition: { duration: duration.fast, ease: easing.standard },
} as const;

export const cardHover = {
  whileHover: { y: -4 },
  transition: { duration: duration.fast, ease: easing.standard },
} as const;

// ── 过渡快捷方式 ──
export const transitionFast = { duration: duration.fast, ease: easing.standard } as const;
export const transitionNormal = { duration: duration.normal, ease: easing.standard } as const;
export const transitionSlow = { duration: duration.slow, ease: easing.enter } as const;
