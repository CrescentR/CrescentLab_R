import type { Variants } from "motion/react";

export const labEase = [0.22, 1, 0.36, 1] as const;

export const revealItem: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.64, ease: labEase } },
};

export const revealGroup: Variants = {
  hidden: {},
  visible: { transition: { delayChildren: 0.06, staggerChildren: 0.08 } },
};

export const viewportOnce = { once: true, amount: 0.18 } as const;
export const hoverTransition = { duration: 0.24, ease: labEase } as const;
