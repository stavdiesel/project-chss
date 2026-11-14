"use client";
import { useEffect, useState } from "react";
const API = process.env.NEXT_PUBLIC_API_URL || "https://chs-backend-oc37.onrender.com";

const STATUSES = [
  { value: "new", label: "Новая" },
  { value: "in_progress", label: "В работе" },
  { value: "done", label: "Выполнена" },
  { value: "not_required", label: "Не требуется" },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [status, setStatus] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ client_id: "", reason: "", action: "", due_date: "" });
  const [msg, setMsg] = useState("");
  const [clients, setClients] = useState<any[]>([]);

  const load = () => {
    const t = localStorage.getItem("token");
    const qs = status ? `?status=${status}` : "";
    fetch(`${API}/api/v1/tasks${qs}`, { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json()).then(setTasks);
  };
  useEffect(load, [status]);

  useEffect(() => {
    const t = localStorage.getItem("token");
    fetch(`${API}/api/v1/clients`, { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json()).then(setClients);
  }, []);

  const createTask = async () => {
    const t = localStorage.getItem("token");
    const body = { client_id: form.client_id || null, reason: form.reason, action: form.action, due_date: form.due_date || null };
    const r = await fetch(`${API}/api/v1/tasks`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` }, body: JSON.stringify(body) });
    if (r.ok) { setMsg("Задача создана"); setShowCreate(false); setForm({ client_id: "", reason: "", action: "", due_date: "" }); load(); }
    else { const d = await r.json(); setMsg(d.detail || "Ошибка"); }
  };

  const changeStatus = async (id: string, newStatus: string) => {
    const t = localStorage.getItem("token");
    await fetch(`${API}/api/v1/tasks/${id}/status?status=${newStatus}`, { method: "PATCH", headers: { Authorization: `Bearer ${t}` } });
    load();
  };

  const clientName = (id: string) => {
    const c = clients.find(x => x.id === id);
    return c ? `${c.first_name} ${c.last_name}` : "—";
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-accent">Задачи</h1>
        <button onClick={() => setShowCreate(true)} className="bg-accent text-bg px-4 py-2 rounded-btn text-sm font-medium">+ Новая задача</button>
      </div>
      {msg && <div className="mb-3 text-success text-sm">{msg}</div>}
      <div className="flex gap-3 mb-4">
        <select value={status} onChange={e => setStatus(e.target.value)} className="bg-surface-2 border border-border rounded-btn px-3 py-2 text-text">
          <option value="">Все статусы</option>
          {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      <div className="space-y-3">
        {tasks.map(t => (
          <div key={t.id} className="bg-surface border border-border rounded-card p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold">{t.reason}</div>
                {t.client_id && <div className="text-sm text-muted">Клиент: {clientName(t.client_id)}</div>}
                {t.action && <div className="text-xs text-muted">Действие: {t.action}</div>}
                {t.due_date && <div className="text-xs text-muted">Срок: {t.due_date}</div>}
              </div>
              <select value={t.status} onChange={e => changeStatus(t.id, e.target.value)} className="bg-surface-2 border border-border rounded-btn px-2 py-1 text-xs">
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
        ))}
        {tasks.length === 0 && <div className="text-muted text-sm">Нет задач.</div>}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setShowCreate(false)}>
          <div className="bg-surface border border-border rounded-card p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-accent mb-4">Новая задача</h2>
            <div className="space-y-3">
              <select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} className="w-full bg-surface-2 border border-border rounded-btn px-3 py-2 text-text">
                <option value="">Клиент (необязательно)</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
              </select>
              <input value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} placeholder="Причина" className="w-full bg-surface-2 border border-border rounded-btn px-3 py-2 text-text" />
              <input value={form.action} onChange={e => setForm({...form, action: e.target.value})} placeholder="Действие (написать/позвонить)" className="w-full bg-surface-2 border border-border rounded-btn px-3 py-2 text-text" />
              <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})} className="w-full bg-surface-2 border border-border rounded-btn px-3 py-2 text-text" />
              <div className="flex gap-2">
                <button onClick={createTask} className="bg-accent text-bg px-4 py-2 rounded-btn text-sm font-medium">Создать</button>
                <button onClick={() => setShowCreate(false)} className="bg-surface-2 text-text px-4 py-2 rounded-btn text-sm">Отмена</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}