"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Lock } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { login } from "@/lib/api/client";
import { buttonPress, fadeUp, scaleIn, transitionFast } from "@/components/home/motionConfig";

const publicSiteUrl = process.env.NEXT_PUBLIC_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("用户名和密码不能为空");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const user = await login(username.trim(), password);
      router.replace(user.is_admin ? "/admin" : "/login?error=forbidden");
    } catch (err) {
      const message = typeof err === "object" && err && "message" in err ? String(err.message) : "登录失败，请稍后重试";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="lab-home login-page">
      <div className="login-bg-grid" aria-hidden="true" />
      <motion.div
        animate="visible"
        className="login-card-wrap"
        initial="hidden"
        variants={scaleIn}
      >
        <motion.div className="login-card-head" variants={fadeUp}>
          <span aria-hidden="true" className="lab-crescent-mark login-crescent-mark" />
          <h1 className="login-title">CRESCENT INDEX</h1>
          <p className="login-subtitle">输入管理员凭据进入后台控制台</p>
        </motion.div>

        <form onSubmit={handleSubmit} className="login-form">
          <motion.label className="login-field" variants={fadeUp}>
            <span className="lab-mono login-field-label">用户名</span>
            <input
              autoComplete="username"
              autoFocus
              className="login-input"
              onChange={(e) => setUsername(e.target.value)}
              placeholder="输入用户名"
              type="text"
              value={username}
            />
          </motion.label>

          <motion.label className="login-field" variants={fadeUp}>
            <span className="lab-mono login-field-label">密码</span>
            <input
              autoComplete="current-password"
              className="login-input"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入密码"
              type="password"
              value={password}
            />
          </motion.label>

          <AnimatePresence mode="wait">
            {error && (
              <motion.p
                animate={{ opacity: 1, y: 0 }}
                className="login-error"
                exit={{ opacity: 0, y: -8 }}
                initial={{ opacity: 0, y: 8 }}
                key={error}
                transition={transitionFast}
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            className="login-button"
            disabled={loading}
            type="submit"
            variants={fadeUp}
            {...buttonPress}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={15} />}
            <span>{loading ? "登录中…" : "登录"}</span>
          </motion.button>
        </form>

        <motion.div className="login-footer" variants={fadeUp}>
          <Link className="login-back-link" href={publicSiteUrl}>
            <ArrowLeft size={14} />
            返回前台
          </Link>
        </motion.div>
      </motion.div>
    </main>
  );
}
