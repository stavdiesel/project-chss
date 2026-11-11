"use client";
import { useEffect, useState } from "react";
const API = "https://chs-backend-oc37.onrender.com";
export default function Trainer() {
  const [sessions, setSessions] = useState<any[]>([]);
  useEffect(() => {
    const t = localStorage.getItem("token");
    const from = new Date().toISOString().slice(0,10);
    const to = new Date(Date.now()+7*86400000).toISOString().slice(0,10);
    fetch(`${API}/api/v1/sessions?date_from=${from}&date_to=${to}`, { headers: { Authorization: `Bearer ${t}` } }).then(r=>r.json()).then(setSessions);
  }, []);
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold text-sage mb-4">Тренер · Моё расписание</h1>
      <div className="space-y-3">
        {sessions.map(s => (
          <div key={s.id} className="bg-white rounded-card p-4 shadow">
            <div className="font-mono text-sm text-muted">{new Date(s.start_at).toLocaleString("ru-RU")}</div>
            <div className="font-semibold">{s.class_type_name} · {s.booked_count}/{s.capacity}</div>
          </div>
        ))}
      </div>
    </div>
  );
}