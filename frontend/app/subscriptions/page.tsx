"use client";
import { useEffect, useState } from "react";
const API = process.env.NEXT_PUBLIC_API_URL || "https://chs-backend-oc37.onrender.com";
export default function Subs() {
  const [subs, setSubs] = useState<any[]>([]);
  useEffect(() => {
    const t = localStorage.getItem("token");
    fetch(`${API}/api/v1/subscriptions/me`, { headers: { Authorization: `Bearer ${t}` } }).then(r=>r.json()).then(setSubs);
  }, []);
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold text-sage mb-4">Абонементы</h1>
      <div className="space-y-3">
        {subs.map(s => (
          <div key={s.id} className="bg-white rounded-card p-4 shadow">
            <div className="font-semibold">{s.type}</div>
            <div className="text-sm text-muted">Осталось: {s.remaining} из {s.total_visits} · до {s.valid_until} · {s.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}