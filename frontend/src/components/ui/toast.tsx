"use client";

import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { createContext, ReactNode, useCallback, useContext, useState } from "react";
import { transitionNormal } from "@/components/home/motionConfig";

type ToastTone = "success" | "error" | "info";

type Toast = {
  id: number;
  message: string;
  tone: ToastTone;
};

type ToastContextValue = {
  push: (message: string, tone?: ToastTone) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

const toneConfig: Record<ToastTone, { icon: typeof Info; color: string }> = {
  success: { icon: CheckCircle2, color: "var(--green)" },
  error: { icon: XCircle, color: "var(--rose)" },
  info: { icon: Info, color: "var(--cyan)" },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, tone: ToastTone = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map((toast) => {
            const config = toneConfig[toast.tone];
            const Icon = config.icon;
            return (
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                className="pointer-events-auto flex min-w-[260px] items-center gap-3 rounded-[10px] border border-[var(--border-soft)] bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-soft)]"
                exit={{ opacity: 0, x: 40 }}
                initial={{ opacity: 0, x: 40 }}
                key={toast.id}
                transition={transitionNormal}
              >
                <Icon color={config.color} size={18} />
                <span className="flex-1 text-sm text-[var(--text-strong)]">{toast.message}</span>
                <button
                  className="text-[var(--muted)] transition-colors hover:text-[var(--text-strong)]"
                  onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                  type="button"
                >
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
