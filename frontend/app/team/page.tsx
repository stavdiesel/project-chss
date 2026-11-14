"use client";
import { useEffect, useState } from "react";
const API = process.env.NEXT_PUBLIC_API_URL || "https://chs-backend-oc37.onrender.com";

export default function TeamPage() {
  const [trainers, setTrainers] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [byTrainer, setByTrainer] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", specialization: "" });
  const [msg, setMsg] = useState("");

  const load = () => {
    const t = localStorage.getItem("token");
    const h = { Authorization: `Bearer ${t}` };
    fetch(`${API}/api/v1/trainers`, { headers: h }).then(r => r.json()).then(setTrainers);
    fetch(`${API}/api/v1/analytics/summary`, { headers: h }).then(r => r.json()).then(setSummary);
    fetch(`${API}/api/v1/analytics/by-trainer`, { headers: h }).then(r => r.json()).then(setByTrainer);
  };
  useEffect(load, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-accent">Команда и отчёты</h1>
        <button onClick={() => setShowCreate(true)} className="bg-accent text-bg px-4 py-2 rounded-btn text-sm font-medium">+ Добавить тренера</button>
      </div>
      <h2 className="text-lg font-semibold text-accent mb-2">Тренеры</h2>
      <div className="grid md:grid-cols-2 gap-3 mb-6">
        {trainers.map(tr => {
          const stat = byTrainer.find(x => x.trainer_id === tr.id);
          return (
            <div key={tr.id} className="bg-surface border border-border rounded-card p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold">{tr.first_name} {tr.last_name}</div>
                  <div className="text-sm text-muted">{tr.specialization || "—"}</div>
                  {stat && <div className="text-xs text-muted mt-2">Занятий: {stat.sessions} · Записей: {stat.bookings} · Посещено: {stat.attended}</div>}
                </div>
                <button onClick={async () => {
                  if (!confirm("Удалить тренера?")) return;
                  const t = localStorage.getItem("token");
                  const r = await fetch(`${API}/api/v1/trainers/${tr.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${t}` } });
                  if (r.ok) { setMsg("Тренер удалён"); load(); }
                  else { setMsg("Ошибка удаления"); }
                }} className="text-xs bg-danger/20 text-danger px-2 py-1 rounded-btn">Удалить</button>
              </div>
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
      {msg && <div className="mb-3 text-success text-sm">{msg}</div>}
      <div className="bg-surface border border-border rounded-card p-4 text-sm text-muted">
        Расчёт зарплаты тренеров: формула (ставка/процент/правила) — «требует настройки» (см. Настройки). Не придумываем.
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setShowCreate(false)}>
          <div className="bg-surface border border-border rounded-card p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-accent mb-4">Новый тренер</h2>
            <div className="space-y-3">
              <input value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} placeholder="Имя" className="w-full bg-surface-2 border border-border rounded-btn px-3 py-2 text-text" />
              <input value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} placeholder="Фамилия" className="w-full bg-surface-2 border border-border rounded-btn px-3 py-2 text-text" />
              <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Email" className="w-full bg-surface-2 border border-border rounded-btn px-3 py-2 text-text" />
              <input value={form.specialization} onChange={e => setForm({...form, specialization: e.target.value})} placeholder="Специализация" className="w-full bg-surface-2 border border-border rounded-btn px-3 py-2 text-text" />
              <div className="flex gap-2">
                <button onClick={async () => {
                  const t = localStorage.getItem("token");
                  const params = new URLSearchParams({ first_name: form.first_name, last_name: form.last_name, email: form.email, specialization: form.specialization });
                  const r = await fetch(`${API}/api/v1/trainers?${params}`, { method: "POST", headers: { Authorization: `Bearer ${t}` } });
                  if (r.ok) { setMsg("Тренер добавлен (пароль password123)"); setShowCreate(false); setForm({ first_name: "", last_name: "", email: "", specialization: "" }); load(); }
                  else { const d = await r.json(); setMsg(d.detail || "Ошибка"); }
                }} className="bg-accent text-bg px-4 py-2 rounded-btn text-sm font-medium">Создать</button>
                <button onClick={() => setShowCreate(false)} className="bg-surface-2 text-text px-4 py-2 rounded-btn text-sm">Отмена</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
