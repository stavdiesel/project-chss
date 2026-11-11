"use client";
import { useEffect, useState } from "react";
const API = process.env.NEXT_PUBLIC_API_URL || "https://chs-backend-oc37.onrender.com";
export default function SchedulePage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    const t = localStorage.getItem("token");
    const from = new Date().toISOString().slice(0,10);
    const to = new Date(Date.now()+7*86400000).toISOString().slice(0,10);
    fetch(`${API}/api/v1/sessions?date_from=${from}&date_to=${to}`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r=>r.json()).then(setSessions);
  }, []);
  async function book(id: string) {
    const t = localStorage.getItem("token");
    const r = await fetch(`${API}/api/v1/bookings?session_id=${id}`, { method:"POST", headers:{ Authorization:`Bearer ${t}` } });
    setMsg(r.ok ? "Записано!" : "Ошибка записи");
  }
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-accent mb-4">Расписание</h1>
      {msg && <div className="mb-3 text-success">{msg}</div>}
      <div className="space-y-3">
        {sessions.map(s => (
          <div key={s.id} className="bg-surface rounded-card p-4 shadow flex justify-between items-center">
            <div>
              <div className="font-mono text-sm text-muted">{new Date(s.start_at).toLocaleString("ru-RU")}</div>
              <div className="font-semibold">{s.class_type_name}</div>
              <div className="text-sm text-muted">{s.trainer_name} · {s.booked_count}/{s.capacity} мест</div>
            </div>
            <button onClick={()=>book(s.id)} className="bg-sage text-white px-4 py-2 rounded-btn">Записаться</button>
          </div>
        ))}
      </div>
    </div>
  );
}