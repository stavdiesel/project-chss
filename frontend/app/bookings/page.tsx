"use client";
import { useEffect, useState } from "react";
const API = process.env.NEXT_PUBLIC_API_URL || "https://chs-backend-oc37.onrender.com";
export default function MyBookings() {
  const [bs, setBs] = useState<any[]>([]);
  useEffect(() => {
    const t = localStorage.getItem("token");
    fetch(`${API}/api/v1/bookings/me`, { headers: { Authorization: `Bearer ${t}` } }).then(r=>r.json()).then(setBs);
  }, []);
  async function cancel(id: string) {
    const t = localStorage.getItem("token");
    await fetch(`${API}/api/v1/bookings/${id}/cancel`, { method:"POST", headers:{ Authorization:`Bearer ${t}` } });
    location.reload();
  }
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold text-accent mb-4">Мои записи</h1>
      <div className="space-y-3">
        {bs.map(b => (
          <div key={b.id} className="bg-surface rounded-card p-4 shadow flex justify-between items-center">
            <div>
              <div className="font-semibold">{b.client_name}</div>
              <div className="text-sm text-muted">Сессия: {b.session_id} · {b.status}</div>
            </div>
            {b.status === "booked" && <button onClick={()=>cancel(b.id)} className="text-danger border border-danger px-3 py-1 rounded-btn">Отменить</button>}
          </div>
        ))}
      </div>
    </div>
  );
}