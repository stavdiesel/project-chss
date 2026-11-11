"use client";
import { useEffect, useState } from "react";
const API = process.env.NEXT_PUBLIC_API_URL || "https://chs-backend-oc37.onrender.com";

export default function TeamPage() {
  const [trainers, setTrainers] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [byTrainer, setByTrainer] = useState<any[]>([]);

  useEffect(() => {
    const t = localStorage.getItem("token");
    const h = { Authorization: `Bearer ${t}` };
    fetch(`${API}/api/v1/trainers`, { headers: h }).then(r=>r.json()).then(setTrainers);
    fetch(`${API}/api/v1/analytics/summary`, { headers: h }).then(r=>r.json()).then(setSummary);
    fetch(`${API}/api/v1/analytics/by-trainer`, { headers: h }).then(r=>r.json()).then(setByTrainer);
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold text-accent mb-4">Команда и отчёты</h1>
      <h2 className="text-lg font-semibold text-accent mb-2">Тренеры</h2>
      <div className="grid md:grid-cols-2 gap-3 mb-6">
        {trainers.map(tr => {
          const stat = byTrainer.find(x => x.trainer_id === tr.id);
          return (
            <div key={tr.id} className="bg-surface border border-border rounded-card p-4">
              <div className="font-semibold">{tr.first_name} {tr.last_name}</div>
              <div className="text-sm text-muted">{tr.specialization || "—"}</div>
              {stat && <div className="text-xs text-muted mt-2">Занятий: {stat.sessions} · Записей: {stat.bookings} · Посещено: {stat.attended}</div>}
            </div>
          );
        })}
        {trainers.length === 0 && <div className="text-muted text-sm">Нет тренеров.</div>}
      </div>
      <h2 className="text-lg font-semibold text-accent mb-2">Отчёты (админ)</h2>
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-surface border border-border rounded-card p-4"><div className="text-xs text-muted">Занятий</div><div className="text-xl font-semibold text-accent">{summary.sessions_total}</div></div>
          <div className="bg-surface border border-border rounded-card p-4"><div className="text-xs text-muted">Записей</div><div className="text-xl font-semibold text-accent">{summary.bookings_total}</div></div>
          <div className="bg-surface border border-border rounded-card p-4"><div className="text-xs text-muted">Посещено</div><div className="text-xl font-semibold text-accent">{summary.attended}</div></div>
          <div className="bg-surface border border-border rounded-card p-4"><div className="text-xs text-muted">Отмены</div><div className="text-xl font-semibold text-accent">{summary.cancelled}</div></div>
          <div className="bg-surface border border-border rounded-card p-4"><div className="text-xs text-muted">Клиентов</div><div className="text-xl font-semibold text-accent">{summary.clients_total}</div></div>
          <div className="bg-surface border border-border rounded-card p-4"><div className="text-xs text-muted">Абонементов</div><div className="text-xl font-semibold text-accent">{summary.subscriptions_active}</div></div>
        </div>
      )}
      <div className="bg-surface border border-border rounded-card p-4 text-sm text-muted">
        Расчёт зарплаты тренеров: формула (ставка/процент/правила) — «требует настройки» (см. Настройки). Не придумываем.
      </div>
    </div>
  );
}
