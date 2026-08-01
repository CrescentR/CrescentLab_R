"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, UserPlus } from "lucide-react";
import { register } from "@/lib/api/client";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await register(username.trim(), nickname.trim(), password);
      router.replace("/");
    } catch (err) {
      setError(typeof err === "object" && err && "message" in err ? String(err.message) : "注册失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="lab-home login-page">
      <div className="login-bg-grid" aria-hidden="true" />
      <div className="login-card-wrap">
        <div className="login-card-head">
          <span aria-hidden="true" className="lab-crescent-mark login-crescent-mark" />
          <h1 className="login-title">创建账号</h1>
          <p className="login-subtitle">注册后即可参与文章评论</p>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-field"><span className="lab-mono login-field-label">用户名</span><input autoComplete="username" autoFocus className="login-input" onChange={(e) => setUsername(e.target.value)} placeholder="3-32 位字母、数字或下划线" required value={username} /></label>
          <label className="login-field"><span className="lab-mono login-field-label">昵称</span><input autoComplete="nickname" className="login-input" maxLength={32} onChange={(e) => setNickname(e.target.value)} placeholder="公开展示的昵称" required value={nickname} /></label>
          <label className="login-field"><span className="lab-mono login-field-label">密码</span><input autoComplete="new-password" className="login-input" minLength={8} onChange={(e) => setPassword(e.target.value)} placeholder="至少 8 位" required type="password" value={password} /></label>
          <label className="login-field"><span className="lab-mono login-field-label">确认密码</span><input autoComplete="new-password" className="login-input" minLength={8} onChange={(e) => setConfirmPassword(e.target.value)} required type="password" value={confirmPassword} /></label>
          {error && <p className="login-error">{error}</p>}
          <button className="login-button" disabled={loading} type="submit">{loading ? <Loader2 className="animate-spin" size={16} /> : <UserPlus size={16} />}<span>{loading ? "注册中…" : "注册"}</span></button>
        </form>
        <div className="login-footer"><Link className="login-back-link" href="/login"><ArrowLeft size={14} />已有账号，去登录</Link><Link className="login-back-link" href="/">返回首页</Link></div>
      </div>
    </main>
  );
}
