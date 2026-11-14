"use client";
import { useEffect, useState } from "react";
const API = process.env.NEXT_PUBLIC_API_URL || "https://chs-backend-oc37.onrender.com";

const STAGES = [
  { value: "new", label: "Новое обращение" },
  { value: "contacted", label: "Связались" },
  { value: "trial_booked", label: "Записан на пробное" },
  { value: "trial_done", label: "Пробное проведено" },
  { value: "converted", label: "Купил абонемент" },
  { value: "lost", label: "Неактуально" },
];

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [stage, setStage] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", phone: "", email: "", source: "", interest: "", next_step: "", notes: "" });
  const [msg, setMsg] = useState("");

  const load = () => {
    const t = localStorage.getItem("token");
    const qs = stage ? `?stage=${stage}` : "";
    fetch(`${API}/api/v1/leads${qs}`, { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json()).then(setLeads);
  };
  useEffect(load, [stage]);

  const createLead = async () => {
    const t = localStorage.getItem("token");
    const r = await fetch(`${API}/api/v1/leads`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` }, body: JSON.stringify(form) });
    if (r.ok) { setMsg("Лид создан"); setShowCreate(false); setForm({ first_name: "", last_name: "", phone: "", email: "", source: "", interest: "", next_step: "", notes: "" }); load(); }
    else { const d = await r.json(); setMsg(d.detail || "Ошибка"); }
  };

  const changeStage = async (id: string, newStage: string) => {
    const t = localStorage.getItem("token");
    await fetch(`${API}/api/v1/leads/${id}/stage?stage=${newStage}`, { method: "PATCH", headers: { Authorization: `Bearer ${t}` } });
    load();
  };

  const convert = async (id: string) => {
    const t = localStorage.getItem("token");
    const r = await fetch(`${API}/api/v1/leads/${id}/convert`, { method: "POST", headers: { Authorization: `Bearer ${t}` } });
    if (r.ok) { setMsg("Переведён в клиента"); load(); }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-accent">Воронка лидов</h1>
        <button onClick={() => setShowCreate(true)} className="bg-accent text-bg px-4 py-2 rounded-btn text-sm font-medium">+ Новый лид</button>
      </div>
      {msg && <div className="mb-3 text-success text-sm">{msg}</div>}
      <div className="flex gap-3 mb-4">
        <select value={stage} onChange={e => setStage(e.target.value)} className="bg-surface-2 border border-border rounded-btn px-3 py-2 text-text">
          <option value="">Все этапы</option>
          {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
      <div className="space-y-3">
        {leads.map(l => (
          <div key={l.id} className="bg-surface border border-border rounded-card p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold">{l.first_name} {l.last_name}</div>
                <div className="text-sm text-muted">{l.phone || "—"} · {l.email || "—"}</div>
                <div className="text-xs text-muted mt-1">Источник: {l.source || "—"} · Интерес: {l.interest || "—"}</div>
                {l.next_step && <div className="text-xs text-muted">Следующий шаг: {l.next_step}</div>}
              </div>
              <div className="flex flex-col gap-2 items-end">
                <select value={l.stage} onChange={e => changeStage(l.id, e.target.value)} className="bg-surface-2 border border-border rounded-btn px-2 py-1 text-xs">
                  {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                {l.stage !== "converted" && <button onClick={() => convert(l.id)} className="text-xs bg-accent text-bg px-3 py-1 rounded-btn">В клиента</button>}
                {l.client_id && <span className="text-xs text-success">Клиент создан</span>}
              </div>
            </div>
          </div>
        ))}
        {leads.length === 0 && <div className="text-muted text-sm">Нет лидов.</div>}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setShowCreate(false)}>
          <div className="bg-surface border border-border rounded-card p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-accent mb-4">Новый лид</h2>
            <div className="space-y-3">
              <input value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} placeholder="Имя" className="w-full bg-surface-2 border border-border rounded-btn px-3 py-2 text-text" />
              <input value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} placeholder="Фамилия" className="w-full bg-surface-2 border border-border rounded-btn px-3 py-2 text-text" />
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Телефон" className="w-full bg-surface-2 border border-border rounded-btn px-3 py-2 text-text" />
              <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Email" className="w-full bg-surface-2 border border-border rounded-btn px-3 py-2 text-text" />
              <input value={form.source} onChange={e => setForm({...form, source: e.target.value})} placeholder="Источник" className="w-full bg-surface-2 border border-border rounded-btn px-3 py-2 text-text" />
              <input value={form.interest} onChange={e => setForm({...form, interest: e.target.value})} placeholder="Интересующее направление" className="w-full bg-surface-2 border border-border rounded-btn px-3 py-2 text-text" />
              <input value={form.next_step} onChange={e => setForm({...form, next_step: e.target.value})} placeholder="Следующий шаг" className="w-full bg-surface-2 border border-border rounded-btn px-3 py-2 text-text" />
              <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Заметки" className="w-full bg-surface-2 border border-border rounded-btn px-3 py-2 text-text" />
              <div className="flex gap-2">
                <button onClick={createLead} className="bg-accent text-bg px-4 py-2 rounded-btn text-sm font-medium">Создать</button>
                <button onClick={() => setShowCreate(false)} className="bg-surface-2 text-text px-4 py-2 rounded-btn text-sm">Отмена</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}