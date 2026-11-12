"use client";
import { useEffect, useState } from "react";
const API = process.env.NEXT_PUBLIC_API_URL || "https://chs-backend-oc37.onrender.com";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const load = () => {
    const t = localStorage.getItem("token");
    fetch(`${API}/api/v1/bookings/me`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => { if (!r.ok) throw new Error("Не удалось загрузить записи"); return r.json(); })
      .then(setBookings)
      .catch(e => setErr(e.message));
  };
  useEffect(load, []);

  const cancel = async (id: string) => {
    const t = localStorage.getItem("token");
    const r = await fetch(`${API}/api/v1/bookings/${id}/cancel`, { method: "POST", headers: { Authorization: `Bearer ${t}` } });
    setMsg(r.ok ? "Отменено" : "Отмена невозможна (срок истёк или нет прав)");
    load();
  };

  const now = new Date();
  const upcoming = bookings.filter(b => b.status === "booked" && b.session_start_at && new Date(b.session_start_at) >= now);
  const past = bookings.filter(b => !(b.status === "booked" && b.session_start_at && new Date(b.session_start_at) >= now));

  const fmt = (d: string) => d ? new Date(d).toLocaleString("ru-RU") : "";

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold text-accent mb-4">Мои записи</h1>
      {msg && <div className="mb-3 text-success text-sm">{msg}</div>}
      {err && <div className="mb-3 text-danger text-sm">{err}</div>}
      <h2 className="text-lg font-semibold text-accent mb-2">Предстоящие</h2>
      <div className="space-y-3 mb-6">
        {upcoming.map(b => (
          <div key={b.id} className="bg-surface border border-border rounded-card p-4 flex justify-between items-center">
            <div>
              <div className="font-semibold">{b.session_class_type_name || "Занятие"}</div>
              <div className="text-xs text-muted">{fmt(b.session_start_at)}{b.session_trainer_name ? ` · ${b.session_trainer_name}` : ""}</div>
              <div className="text-xs text-muted mt-1">Статус: {b.status}</div>
            </div>
            <button onClick={() => cancel(b.id)} className="text-xs bg-danger/20 text-danger px-3 py-1 rounded-btn">Отменить</button>
          </div>
        ))}
        {upcoming.length === 0 && <div className="text-muted text-sm">Нет предстоящих записей.</div>}
      </div>
      <h2 className="text-lg font-semibold text-accent mb-2">История</h2>
      <div className="space-y-2">
        {past.map(b => (
          <div key={b.id} className="bg-surface border border-border rounded-card p-3 text-sm">
            <div className="flex justify-between">
              <span>{b.session_class_type_name || b.status} · {fmt(b.session_start_at)}{new Date(b.session_start_at) < now ? " · прошло" : ""}</span>
              <span className="text-xs text-muted">{b.created_at?.slice(0,16)}</span>
            </div>
          </div>
        ))}
        {past.length === 0 && <div className="text-muted text-sm">История пуста.</div>}
      </div>
      <div className="mt-4 text-xs text-muted">Отмена возможна не позднее чем за установленный срок до начала (настройка «Срок отмены»). Срок задаётся администратором.</div>
    </div>
  );
}
