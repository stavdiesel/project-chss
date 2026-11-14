"use client";
import { useEffect, useState } from "react";
const API = process.env.NEXT_PUBLIC_API_URL || "https://chs-backend-oc37.onrender.com";

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [filterClient, setFilterClient] = useState("");
  const [history, setHistory] = useState<any>(null);
  const [form, setForm] = useState({ client_id: "", type: "package", total_visits: "8", valid_from: "", valid_until: "", price: "" });
  const [msg, setMsg] = useState("");

  const load = () => {
    const t = localStorage.getItem("token");
    if (!t) { window.location.href = "/"; return; }
    const url = filterClient ? `${API}/api/v1/subscriptions?client_id=${filterClient}` : `${API}/api/v1/subscriptions`;
    fetch(url, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => { if (!r.ok) throw new Error("Не удалось загрузить абонементы"); return r.json(); })
      .then(setSubs).catch(e => setMsg(e.message));
    fetch(`${API}/api/v1/clients`, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => { if (!r.ok) throw new Error("Не удалось загрузить клиентов"); return r.json(); })
      .then(setClients).catch(() => {});
  };
  useEffect(load, [filterClient]);

  const create = async () => {
    const t = localStorage.getItem("token");
    const body = { client_id: form.client_id, type: form.type, total_visits: parseInt(form.total_visits), valid_from: form.valid_from, valid_until: form.valid_until, price: parseFloat(form.price || "0") };
    const r = await fetch(`${API}/api/v1/subscriptions`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` }, body: JSON.stringify(body) });
    if (r.ok) { setMsg("Абонемент создан"); setForm({ client_id: "", type: "package", total_visits: "8", valid_from: "", valid_until: "", price: "" }); load(); }
    else { const d = await r.json(); setMsg(d.detail || "Ошибка"); }
  };

  const openHistory = async (id: string) => {
    const t = localStorage.getItem("token");
    const r = await fetch(`${API}/api/v1/subscriptions/${id}/history`, { headers: { Authorization: `Bearer ${t}` } });
    setHistory(await r.json());
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold text-accent mb-4">Абонементы</h1>
      {msg && <div className="mb-3 text-success text-sm">{msg}</div>}
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={filterClient} onChange={e => setFilterClient(e.target.value)} className="bg-surface-2 border border-border rounded-btn px-3 py-2 text-text">
          <option value="">Все клиенты</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
        </select>
      </div>
      <div className="bg-surface border border-border rounded-card p-4 mb-6 space-y-3">
        <h2 className="text-sm font-semibold text-accent">Новый абонемент</h2>
        <select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} className="w-full bg-surface-2 border border-border rounded-btn px-3 py-2 text-text">
          <option value="">Клиент</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
        </select>
        <input value={form.type} onChange={e => setForm({...form, type: e.target.value})} placeholder="Тип" className="w-full bg-surface-2 border border-border rounded-btn px-3 py-2 text-text" />
        <input value={form.total_visits} onChange={e => setForm({...form, total_visits: e.target.value})} placeholder="Всего занятий" type="number" className="w-full bg-surface-2 border border-border rounded-btn px-3 py-2 text-text" />
        <div className="flex gap-2">
          <input value={form.valid_from} onChange={e => setForm({...form, valid_from: e.target.value})} type="date" className="flex-1 bg-surface-2 border border-border rounded-btn px-3 py-2 text-text" />
          <input value={form.valid_until} onChange={e => setForm({...form, valid_until: e.target.value})} type="date" className="flex-1 bg-surface-2 border border-border rounded-btn px-3 py-2 text-text" />
        </div>
        <input value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="Цена" type="number" className="w-full bg-surface-2 border border-border rounded-btn px-3 py-2 text-text" />
        <button onClick={create} className="bg-accent text-bg px-4 py-2 rounded-btn text-sm font-medium">Создать</button>
      </div>
      <div className="bg-surface border border-border rounded-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface-2"><tr>
            <th className="p-3 text-left text-xs text-muted">Клиент</th>
            <th className="p-3 text-left text-xs text-muted">Тип</th>
            <th className="p-3 text-left text-xs text-muted">Остаток</th>
            <th className="p-3 text-left text-xs text-muted">Срок</th>
            <th className="p-3 text-left text-xs text-muted">Статус</th>
            <th className="p-3 text-left text-xs text-muted">История</th>
            <th className="p-3 text-left text-xs text-muted">Действия</th>
          </tr></thead>
          <tbody>
            {subs.map(s => {
              const c = clients.find(x => x.id === s.client_id);
              return (
                <tr key={s.id} className="border-t border-border">
                  <td className="p-3">{c ? `${c.first_name} ${c.last_name}` : s.client_id}</td>
                  <td className="p-3 text-sm">{s.type}</td>
                  <td className="p-3">{s.remaining}/{s.total_visits}</td>
                  <td className="p-3 text-xs text-muted">{s.valid_from} → {s.valid_until}</td>
                  <td className="p-3"><span className={`text-xs px-2 py-1 rounded-btn ${s.status === "active" ? "bg-success/20 text-success" : "bg-surface-2 text-muted"}`}>{s.status}</span></td>
                  <td className="p-3"><button onClick={() => openHistory(s.id)} className="text-xs text-accent underline">История</button></td>
                  <td className="p-3">
                    {s.status === "frozen" ? (
                      <button onClick={async () => { const t = localStorage.getItem("token"); const r = await fetch(`${API}/api/v1/subscriptions/${s.id}/unfreeze`, { method: "POST", headers: { Authorization: `Bearer ${t}` } }); if (r.ok) load(); }} className="text-xs bg-success/20 text-success px-2 py-1 rounded-btn">Разморозить</button>
                    ) : (
                      <button onClick={async () => { const t = localStorage.getItem("token"); const r = await fetch(`${API}/api/v1/subscriptions/${s.id}/freeze?days=7`, { method: "POST", headers: { Authorization: `Bearer ${t}` } }); if (r.ok) load(); }} className="text-xs bg-warn/20 text-warn px-2 py-1 rounded-btn">Заморозить</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {subs.length === 0 && <div className="p-4 text-muted text-sm">Нет абонементов.</div>}
      </div>

      {history && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" onClick={() => setHistory(null)}>
          <div className="bg-surface border border-border rounded-card p-6 max-w-md w-full max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-3">
              <h2 className="text-lg font-semibold text-accent">История списаний</h2>
              <button onClick={() => setHistory(null)} className="text-muted hover:text-text">✕</button>
            </div>
            {(history.history || []).length === 0 && <div className="text-muted text-sm">Нет событий.</div>}
            {(history.history || []).map((h: any, i: number) => (
              <div key={i} className="bg-surface-2 border border-border rounded-btn p-2 mb-2 text-sm">
                <div className="font-medium">{h.event}</div>
                <div className="text-xs text-muted">{h.at?.slice(0,19)} {h.booking_id ? `· booking ${h.booking_id.slice(0,8)}` : ""}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
