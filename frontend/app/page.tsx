"use client";
import { useState } from "react";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export default function Login() {
  const [email, setEmail] = useState("client1@chs.ru");
  const [password, setPassword] = useState("password123");
  const [err, setErr] = useState("");
  async function submit(e: any) {
    e.preventDefault();
    const r = await fetch(`${API}/api/v1/auth/login`, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({email,password}) });
    if (!r.ok) { setErr("Неверный логин"); return; }
    const d = await r.json();
    localStorage.setItem("token", d.access_token);
    localStorage.setItem("role", d.role);
    window.location.href = d.role === "admin" ? "/admin" : d.role === "trainer" ? "/trainer" : "/schedule";
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-beige">
      <form onSubmit={submit} className="bg-white p-8 rounded-card shadow w-96 space-y-4">
        <h1 className="text-2xl font-semibold text-sage">ЧС · Вход</h1>
        <input className="w-full border rounded-btn p-3" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
        <input className="w-full border rounded-btn p-3" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Пароль" />
        {err && <div className="text-danger text-sm">{err}</div>}
        <button className="w-full bg-sage text-white rounded-btn py-3">Войти</button>
        <div className="text-xs text-muted">Тестовые: admin@chs.ru / trainer1@chs.ru / client1@chs.ru, пароль password123</div>
      </form>
    </div>
  );
}