"use client";
import { useEffect, useState } from "react";
const API = process.env.NEXT_PUBLIC_API_URL || "https://chs-backend-oc37.onrender.com";

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  const load = () => {
    const t = localStorage.getItem("token");
    fetch(`${API}/api/v1/bookings/me`, { headers: { Authorization: `Bearer ${t}` } }).then(r=>r.json()).then(setBookings);
  };
  useEffect(load, []);

  const cancel = async (id: string) => {
    const t = localStorage.getItem("token");
    const r = await fetch(`${API}/api/v1/bookings/${id}/cancel`, { method: "POST", headers: { Authorization: `Bearer ${t}` } });
    setMsg(r.ok ? "Отменено" : "Отмена невозможна (срок истёк или нет прав)");
    load();
  };

  const upcoming = bookings.filter(b => b.status === "booked");
  const past = bookings.filter(b => b.status !== "booked");

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold text-accent mb-4">Мои записи</h1>
      {msg && <div className="mb-3 text-success text-sm">{msg}</div>}
      <h2 className="text-lg font-semibold text-accent mb-2">Предстоящие</h2>
      <div className="space-y-3 mb-6">
        {upcoming.map(b => (
          <div key={b.id} className="bg-surface border border-border rounded-card p-4 flex justify-between items-center">
            <div>
              <div className="font-semibold">{b.client_name ? "" : ""}{b.status}</div>
              <div className="text-xs text-muted">Бронь #{b.id.slice(0,8)} · {b.created_at?.slice(0,16)}</div>
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
              <span>{b.status}</span>
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
