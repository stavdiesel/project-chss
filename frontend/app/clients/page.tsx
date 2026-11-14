"use client";
import { useEffect, useState } from "react";
const API = process.env.NEXT_PUBLIC_API_URL || "https://chs-backend-oc37.onrender.com";

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [segment, setSegment] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [subs, setSubs] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", notes: "" });
  const [msg, setMsg] = useState("");

  const load = () => {
    const t = localStorage.getItem("token");
    fetch(`${API}/api/v1/clients`, { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json()).then(setClients);
  };
  useEffect(load, []);

  const filtered = clients.filter(c => {
    const hay = `${c.first_name} ${c.last_name} ${c.email || ""} ${c.phone || ""}`.toLowerCase();
    if (q && !hay.includes(q.toLowerCase())) return false;
    if (status && c.status !== status) return false;
    if (segment && c.segment !== segment) return false;
    return true;
  });

  const openClient = (c: any) => {
    setSelected(c);
    const t = localStorage.getItem("token");
    fetch(`${API}/api/v1/subscriptions?client_id=${c.id}`, { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json()).then(setSubs);
  };

  const createClient = async () => {
    const t = localStorage.getItem("token");
    const r = await fetch(`${API}/api/v1/clients`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` }, body: JSON.stringify(form) });
    if (r.ok) { setMsg("Клиент создан (пароль по умолчанию password123)"); setShowCreate(false); setForm({ first_name: "", last_name: "", email: "", phone: "", notes: "" }); load(); }
    else { const d = await r.json(); setMsg(d.detail || "Ошибка"); }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-accent">Клиенты</h1>
        <button onClick={() => setShowCreate(true)} className="bg-accent text-bg px-4 py-2 rounded-btn text-sm font-medium">+ Создать</button>
        <button onClick={() => { window.open(`${API}/api/v1/clients/export`, "_blank"); }} className="bg-surface-2 text-text px-4 py-2 rounded-btn text-sm">Экспорт CSV</button>
        <button onClick={async () => {
          const t = localStorage.getItem("token");
          const r = await fetch(`${API}/api/v1/clients/auto-segment`, { method: "POST", headers: { Authorization: `Bearer ${t}` } });
          if (r.ok) { const d = await r.json(); setMsg(`Пересчитано: ${d.updated} из ${d.total}`); load(); }
        }} className="bg-surface-2 text-text px-4 py-2 rounded-btn text-sm">Пересчитать сегменты</button>
      </div>
      {msg && <div className="mb-3 text-success text-sm">{msg}</div>}
      <div className="flex flex-wrap gap-3 mb-4">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Поиск по имени, телефону, email" className="bg-surface-2 border border-border rounded-btn px-3 py-2 text-text flex-1 min-w-[200px]" />
        <select value={status} onChange={e => setStatus(e.target.value)} className="bg-surface-2 border border-border rounded-btn px-3 py-2 text-text">
          <option value="">Все статусы</option>
          <option value="active">Активен</option>
          <option value="inactive">Неактивен</option>
        </select>
        <select value={segment} onChange={e => setSegment(e.target.value)} className="bg-surface-2 border border-border rounded-btn px-3 py-2 text-text">
          <option value="">Все сегменты</option>
          <option value="new">Новый лид</option>
          <option value="newcomer">Новичок</option>
          <option value="active">Активный</option>
          <option value="expiring">Заканчивается</option>
          <option value="at_risk">Зона потери</option>
          <option value="sleeping">Спящий</option>
          <option value="declined">Отказался</option>
        </select>
      </div>

      <div className="hidden md:block bg-surface border border-border rounded-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface-2"><tr>
            <th className="p-3 text-left text-xs text-muted">Имя</th>
            <th className="p-3 text-left text-xs text-muted">Email</th>
            <th className="p-3 text-left text-xs text-muted">Телефон</th>
            <th className="p-3 text-left text-xs text-muted">Статус</th>
            <th className="p-3 text-left text-xs text-muted">Сегмент</th>
          </tr></thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} onClick={() => openClient(c)} className="border-t border-border hover:bg-surface-2 cursor-pointer">
                <td className="p-3">{c.first_name} {c.last_name}</td>
                <td className="p-3 text-muted">{c.email || "—"}</td>
                <td className="p-3 text-muted">{c.phone || "—"}</td>
                <td className="p-3"><span className={`text-xs px-2 py-1 rounded-btn ${c.status === "active" ? "bg-success/20 text-success" : "bg-warn/20 text-warn"}`}>{c.status}</span></td>
                <td className="p-3 text-xs text-muted">{c.segment || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-4 text-muted text-sm">Нет клиентов.</div>}
      </div>

      <div className="md:hidden space-y-2">
        {filtered.map(c => (
          <div key={c.id} onClick={() => openClient(c)} className="bg-surface border border-border rounded-card p-4 cursor-pointer">
            <div className="font-semibold">{c.first_name} {c.last_name}</div>
            <div className="text-sm text-muted">{c.email || "—"} · {c.phone || "—"}</div>
            <div className="text-xs mt-1"><span className={`px-2 py-1 rounded-btn ${c.status === "active" ? "bg-success/20 text-success" : "bg-warn/20 text-warn"}`}>{c.status}</span></div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setSelected(null)}>
          <div className="bg-surface border border-border rounded-card p-6 max-w-lg w-full max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-xl font-semibold text-accent">{selected.first_name} {selected.last_name}</h2>
              <button onClick={() => setSelected(null)} className="text-muted hover:text-text">✕</button>
            </div>
            <div className="text-sm space-y-1 mb-4">
              <div><span className="text-muted">Email:</span> {selected.email || "—"}</div>
              <div><span className="text-muted">Телефон:</span> {selected.phone || "—"}</div>
              <div><span className="text-muted">Статус:</span> {selected.status}</div>
              <div><span className="text-muted">Сегмент:</span> {selected.segment || "—"}
                <select value={selected.segment || ""} onChange={async e => {
                  const t = localStorage.getItem("token");
                  const r = await fetch(`${API}/api/v1/clients/${selected.id}/segment?segment=${e.target.value}`, { method: "PATCH", headers: { Authorization: `Bearer ${t}` } });
                  if (r.ok) { const d = await r.json(); setSelected(d); load(); }
                }} className="ml-2 bg-surface-2 border border-border rounded-btn px-2 py-1 text-xs">
                  <option value="new">Новый лид</option>
                  <option value="newcomer">Новичок</option>
                  <option value="active">Активный</option>
                  <option value="expiring">Заканчивается</option>
                  <option value="at_risk">Зона потери</option>
                  <option value="sleeping">Спящий</option>
                  <option value="declined">Отказался</option>
                </select>
              </div>
              {selected.notes && <div><span className="text-muted">Заметки:</span> {selected.notes}</div>}
            </div>
            <h3 className="text-sm font-semibold text-accent mb-2">Абонементы</h3>
            {subs.length === 0 && <div className="text-muted text-xs">Нет абонементов.</div>}
            {subs.map(s => (
              <div key={s.id} className="bg-surface-2 border border-border rounded-btn p-3 mb-2 text-sm">
                <div>{s.type} · {s.used_visits}/{s.total_visits} занятий</div>
                <div className="text-muted text-xs">до {s.valid_until} · {s.status} · остаток {s.remaining}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setShowCreate(false)}>
          <div className="bg-surface border border-border rounded-card p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-semibold text-accent mb-4">Новый клиент</h2>
            <div className="space-y-3">
              <input value={form.first_name} onChange={e => setForm({...form, first_name: e.target.value})} placeholder="Имя" className="w-full bg-surface-2 border border-border rounded-btn px-3 py-2 text-text" />
              <input value={form.last_name} onChange={e => setForm({...form, last_name: e.target.value})} placeholder="Фамилия" className="w-full bg-surface-2 border border-border rounded-btn px-3 py-2 text-text" />
              <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Email" className="w-full bg-surface-2 border border-border rounded-btn px-3 py-2 text-text" />
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Телефон" className="w-full bg-surface-2 border border-border rounded-btn px-3 py-2 text-text" />
              <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Заметки" className="w-full bg-surface-2 border border-border rounded-btn px-3 py-2 text-text" />
              <div className="flex gap-2">
                <button onClick={createClient} className="bg-accent text-bg px-4 py-2 rounded-btn text-sm font-medium">Создать</button>
                <button onClick={() => setShowCreate(false)} className="bg-surface-2 text-text px-4 py-2 rounded-btn text-sm">Отмена</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
