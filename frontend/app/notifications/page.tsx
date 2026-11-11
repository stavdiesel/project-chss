"use client";
import { useEffect, useState } from "react";
const API = process.env.NEXT_PUBLIC_API_URL || "https://chs-backend-oc37.onrender.com";

export default function NotificationsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [form, setForm] = useState({ client_id: "", channel: "telegram", message: "" });
  const [msg, setMsg] = useState("");

  const load = () => {
    const t = localStorage.getItem("token");
    fetch(`${API}/api/v1/notifications`, { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json()).then(setItems);
    fetch(`${API}/api/v1/clients`, { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json()).then(setClients);
  };
  useEffect(load, []);

  const create = async () => {
    const t = localStorage.getItem("token");
    const body = { client_id: form.client_id || null, channel: form.channel, message: form.message };
    const r = await fetch(`${API}/api/v1/notifications`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` }, body: JSON.stringify(body) });
    if (r.ok) { setMsg("Уведомление сохранено в журнале (канал не подключён — не отправлено)"); setForm({ client_id: "", channel: "telegram", message: "" }); load(); }
    else { const d = await r.json(); setMsg(d.detail || "Ошибка"); }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold text-accent mb-4">Уведомления</h1>
      <div className="text-xs text-muted mb-4">Журнал уведомлений. Каналы (MAX/Telegram/email) не подключены — статус «не отправлено: канал не подключён». Не показывается как доставленное.</div>
      {msg && <div className="mb-3 text-success text-sm">{msg}</div>}
      <div className="bg-surface border border-border rounded-card p-4 mb-6 space-y-3">
        <h2 className="text-sm font-semibold text-accent">Новое уведомление (демо)</h2>
        <select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} className="w-full bg-surface-2 border border-border rounded-btn px-3 py-2 text-text">
          <option value="">Без клиента</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
        </select>
        <select value={form.channel} onChange={e => setForm({...form, channel: e.target.value})} className="w-full bg-surface-2 border border-border rounded-btn px-3 py-2 text-text">
          <option value="telegram">Telegram</option>
          <option value="email">Email</option>
          <option value="max">MAX</option>
        </select>
        <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} placeholder="Текст" className="w-full bg-surface-2 border border-border rounded-btn px-3 py-2 text-text" />
        <button onClick={create} className="bg-accent text-bg px-4 py-2 rounded-btn text-sm font-medium">Сохранить в журнал</button>
      </div>
      <div className="space-y-2">
        {items.map(n => (
          <div key={n.id} className="bg-surface border border-border rounded-card p-4">
            <div className="flex justify-between items-start">
              <div className="text-sm">{n.message}</div>
              <span className={`text-xs px-2 py-1 rounded-btn ${n.status === "sent" ? "bg-success/20 text-success" : "bg-warn/20 text-warn"}`}>{n.status}</span>
            </div>
            <div className="text-xs text-muted mt-1">{n.client_name} · {n.channel} · {n.reason || ""} · {n.created_at?.slice(0,16)}</div>
          </div>
        ))}
        {items.length === 0 && <div className="text-muted text-sm">Журнал пуст.</div>}
      </div>
    </div>
  );
}
