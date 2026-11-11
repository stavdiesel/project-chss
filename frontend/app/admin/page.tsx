"use client";
import { useEffect, useState } from "react";
const API = process.env.NEXT_PUBLIC_API_URL || "https://chs-backend-oc37.onrender.com";

export default function AdminDashboard() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("token");
    const h = { Authorization: `Bearer ${t}` };
    const today = new Date().toISOString().slice(0, 10);
    Promise.all([
      fetch(`${API}/api/v1/sessions?date_from=${today}&date_to=${today}`, { headers: h }).then(r => r.json()),
      fetch(`${API}/api/v1/analytics/summary?date_from=${today}&date_to=${today}`, { headers: h }).then(r => r.json()),
    ]).then(([s, sm]) => { setSessions(Array.isArray(s) ? s : []); setSummary(sm); })
      .catch(() => setErr("Не удалось загрузить данные"))
      .finally(() => setLoading(false));
  }, []);

  const card = (label: string, value: any, color: string) => (
    <div className="bg-surface border border-border rounded-card p-4" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="text-xs text-muted">{label}</div>
      <div className="text-2xl font-semibold mt-1" style={{ color }}>{value ?? "—"}</div>
    </div>
  );

  const totalCap = sessions.reduce((a, s) => a + (s.capacity || 0), 0);
  const totalBooked = sessions.reduce((a, s) => a + (s.booked_count || 0), 0);
  const free = totalCap - totalBooked;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold text-accent mb-4">Дашборд · Сегодня</h1>
      {loading && <div className="text-muted">Загрузка...</div>}
      {err && <div className="text-danger mb-3">{err}</div>}
      {!loading && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {card("Занятий сегодня", sessions.length, "#19B6A3")}
            {card("Записей", totalBooked, "#397BE5")}
            {card("Свободных мест", free, "#C34B83")}
            {card("Активных абонементов", summary?.subscriptions_active ?? 0, "#C85A3E")}
          </div>
          <h2 className="text-lg font-semibold text-accent mb-2">Ближайшие занятия</h2>
          <div className="space-y-2 mb-6">
            {sessions.length === 0 && <div className="text-muted text-sm">Нет занятий на сегодня.</div>}
            {sessions.map(s => (
              <div key={s.id} className="bg-surface border border-border rounded-card p-4 flex justify-between items-center">
                <div>
                  <div className="font-mono text-xs text-muted">{new Date(s.start_at).toLocaleTimeString("ru-RU", {hour:"2-digit",minute:"2-digit"})}</div>
                  <div className="font-semibold">{s.class_type_name}</div>
                  <div className="text-sm text-muted">{s.trainer_name} · {s.booked_count}/{s.capacity} мест</div>
                </div>
                <div className={`text-xs px-2 py-1 rounded-btn ${s.booked_count >= s.capacity ? "bg-danger/20 text-danger" : "bg-success/20 text-success"}`}>
                  {s.booked_count >= s.capacity ? "Мест нет" : "Есть места"}
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <a href="/schedule" className="bg-surface border border-border rounded-card p-4 text-center hover:border-accent transition">
              <div className="text-accent font-medium">Расписание</div>
            </a>
            <a href="/clients" className="bg-surface border border-border rounded-card p-4 text-center hover:border-accent transition">
              <div className="text-accent font-medium">Клиенты</div>
            </a>
            <a href="/subscriptions" className="bg-surface border border-border rounded-card p-4 text-center hover:border-accent transition">
              <div className="text-accent font-medium">Абонементы</div>
            </a>
            <a href="/analytics" className="bg-surface border border-border rounded-card p-4 text-center hover:border-accent transition">
              <div className="text-accent font-medium">Аналитика</div>
            </a>
          </div>
          <div className="mt-6 text-xs text-muted">Оплаты и уведомления помечены как «требует настройки»: платёжный провайдер и каналы (MAX/Telegram/email) не подключены.</div>
        </>
      )}
    </div>
  );
}