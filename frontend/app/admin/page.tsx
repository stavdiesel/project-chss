"use client";
import { useEffect, useState } from "react";
const API = process.env.NEXT_PUBLIC_API_URL || "https://chs-backend-oc37.onrender.com";
export default function Admin() {
  const [clients, setClients] = useState<any[]>([]);
  useEffect(() => {
    const t = localStorage.getItem("token");
    fetch(`${API}/api/v1/clients`, { headers: { Authorization: `Bearer ${t}` } }).then(r=>r.json()).then(setClients);
  }, []);
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold text-sage mb-4">Админка · Клиенты</h1>
      <div className="bg-white rounded-card shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-beige"><tr><th className="p-3 text-left">Имя</th><th className="p-3 text-left">Email</th><th className="p-3 text-left">Телефон</th><th className="p-3 text-left">Статус</th></tr></thead>
          <tbody>
            {clients.map(c => (
              <tr key={c.id} className="border-t border-border">
                <td className="p-3">{c.first_name} {c.last_name}</td>
                <td className="p-3">{c.email}</td>
                <td className="p-3">{c.phone}</td>
                <td className="p-3">{c.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 text-sm text-muted">Расписание и абонементы — через API /api/v1 (Swagger: https://chs-backend-oc37.onrender.com/docs)</div>
    </div>
  );
}