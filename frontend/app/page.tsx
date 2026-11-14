"use client";
import { useState } from "react";
const API = process.env.NEXT_PUBLIC_API_URL || "https://chs-backend-oc37.onrender.com";
export default function Login() {
  const [email, setEmail] = useState("client1@chs.ru");
  const [password, setPassword] = useState("password123");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e: any) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const r = await fetch(`${API}/api/v1/auth/login`, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({email,password}) });
      if (!r.ok) { setErr("Неверный email или пароль"); return; }
      const d = await r.json();
      localStorage.setItem("token", d.access_token);
      localStorage.setItem("role", d.role);
      window.location.href = d.role === "admin" ? "/admin" : d.role === "trainer" ? "/trainer" : "/schedule";
    } catch { setErr("Сервер недоступен"); }
    finally { setLoading(false); }
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <form onSubmit={submit} className="bg-surface border border-border p-8 rounded-card shadow w-full max-w-md space-y-4">
        <h1 className="text-2xl font-semibold text-accent">ЧСС · Вход</h1>
        <p className="text-sm text-muted">Управление фитнес-студией</p>
        <input className="w-full bg-surface-2 border border-border rounded-btn p-3 text-text placeholder:text-muted" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
        <input className="w-full bg-surface-2 border border-border rounded-btn p-3 text-text placeholder:text-muted" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Пароль" />
        {err && <div className="text-danger text-sm">{err}</div>}
        <button disabled={loading} className="w-full bg-accent text-bg rounded-btn py-3 font-medium disabled:opacity-60">{loading ? "Вход..." : "Войти"}</button>
        <div className="text-xs text-muted">Тестовые: admin@chs.ru / trainer1@chs.ru / client1@chs.ru, пароль password123</div>
      </form>
    </div>
  );
}
