"use client";
import { useEffect, useState } from "react";
const API = process.env.NEXT_PUBLIC_API_URL || "https://chs-backend-oc37.onrender.com";

export default function TrainerPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  const load = () => {
    const t = localStorage.getItem("token");
    const from = new Date().toISOString().slice(0,10);
    const to = new Date(Date.now()+7*86400000).toISOString().slice(0,10);
    fetch(`${API}/api/v1/sessions?date_from=${from}&date_to=${to}`, { headers: { Authorization: `Bearer ${t}` } }).then(r=>r.json()).then(setSessions);
  };
  useEffect(load, []);

  const openSession = async (s: any) => {
    setSelected(s);
    const t = localStorage.getItem("token");
    const r = await fetch(`${API}/api/v1/bookings/session/${s.id}`, { headers: { Authorization: `Bearer ${t}` } });
    setBookings(await r.json());
  };

  const attend = async (bid: string) => {
    const t = localStorage.getItem("token");
    const r = await fetch(`${API}/api/v1/bookings/${bid}/attend`, { method: "POST", headers: { Authorization: `Bearer ${t}` } });
    setMsg(r.ok ? "Посещение отмечено" : "Ошибка");
    if (selected) openSession(selected);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold text-accent mb-4">Мои занятия</h1>
      {msg && <div className="mb-3 text-success text-sm">{msg}</div>}
      <div className="space-y-3">
        {sessions.map(s => (
          <div key={s.id} className="bg-surface border border-border rounded-card p-4 flex justify-between items-center">
            <div>
              <div className="font-mono text-xs text-muted">{new Date(s.start_at).toLocaleString("ru-RU")}</div>
              <div className="font-semibold">{s.class_type_name}</div>
              <div className="text-sm text-muted">{s.booked_count}/{s.capacity} записано</div>
            </div>
            <button onClick={() => openSession(s)} className="bg-surface-2 text-text px-4 py-2 rounded-btn text-sm">Список</button>
          </div>
        ))}
        {sessions.length === 0 && <div className="text-muted text-sm">Нет занятий.</div>}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setSelected(null)}>
          <div className="bg-surface border border-border rounded-card p-6 max-w-lg w-full max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-lg font-semibold text-accent">{selected.class_type_name}</h2>
              <button onClick={() => setSelected(null)} className="text-muted hover:text-text">✕</button>
            </div>
            <div className="text-sm text-muted mb-3">{new Date(selected.start_at).toLocaleString("ru-RU")} · {selected.booked_count}/{selected.capacity}</div>
            <div className="space-y-2">
              {bookings.map(b => (
                <div key={b.id} className="bg-surface-2 border border-border rounded-btn p-3 flex justify-between items-center">
                  <div>
                    <div className="font-medium">{b.client_name}</div>
                    <div className="text-xs text-muted">{b.status}</div>
                  </div>
                  {b.status === "booked" && (
                    <button onClick={() => attend(b.id)} className="text-xs bg-accent text-bg px-3 py-1 rounded-btn">Отметить посещение</button>
                  )}
                </div>
              ))}
              {bookings.length === 0 && <div className="text-muted text-sm">Нет записей.</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
