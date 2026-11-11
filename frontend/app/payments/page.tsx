"use client";
import { useEffect, useState } from "react";
const API = process.env.NEXT_PUBLIC_API_URL || "https://chs-backend-oc37.onrender.com";

export default function PaymentsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState({ client_id: "", amount: "", purpose: "Разовое занятие" });
  const [msg, setMsg] = useState("");

  const load = () => {
    const t = localStorage.getItem("token");
    const url = filter ? `${API}/api/v1/payments?status=${filter}` : `${API}/api/v1/payments`;
    fetch(url, { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json()).then(setItems);
    fetch(`${API}/api/v1/clients`, { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json()).then(setClients);
  };
  useEffect(load, [filter]);

  const create = async () => {
    const t = localStorage.getItem("token");
    const body = { client_id: form.client_id || null, amount: parseFloat(form.amount || "0"), purpose: form.purpose };
    const r = await fetch(`${API}/api/v1/payments`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` }, body: JSON.stringify(body) });
    if (r.ok) { setMsg("Платёж создан (ручной/демо, интеграция не подключена)"); setForm({ client_id: "", amount: "", purpose: "Разовое занятие" }); load(); }
    else { const d = await r.json(); setMsg(d.detail || "Ошибка"); }
  };

  const updateStatus = async (id: string, status: string) => {
    const t = localStorage.getItem("token");
    await fetch(`${API}/api/v1/payments/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` }, body: JSON.stringify({ status, note: "Ручное изменение" }) });
    load();
  };

  const color = (s: string) => s === "success" ? "bg-success/20 text-success" : s === "failed" ? "bg-danger/20 text-danger" : s === "refunded" ? "bg-warn/20 text-warn" : "bg-surface-2 text-muted";

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold text-accent mb-4">Оплаты</h1>
      <div className="text-xs text-muted mb-4">Реестр платежей (ручной/демо). Интеграция с банком/кассой/терминалом не подключена — статусы меняются вручную. История изменения статуса сохраняется.</div>
      {msg && <div className="mb-3 text-success text-sm">{msg}</div>}
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={filter} onChange={e => setFilter(e.target.value)} className="bg-surface-2 border border-border rounded-btn px-3 py-2 text-text">
          <option value="">Все статусы</option>
          <option value="pending">Ожидает</option>
          <option value="success">Успешно</option>
          <option value="failed">Ошибка</option>
          <option value="refunded">Возврат</option>
        </select>
      </div>
      <div className="bg-surface border border-border rounded-card p-4 mb-6 space-y-3">
        <h2 className="text-sm font-semibold text-accent">Новый платёж (демо)</h2>
        <select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} className="w-full bg-surface-2 border border-border rounded-btn px-3 py-2 text-text">
          <option value="">Без клиента</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
        </select>
        <input value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} placeholder="Сумма" type="number" className="w-full bg-surface-2 border border-border rounded-btn px-3 py-2 text-text" />
        <input value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})} placeholder="Назначение" className="w-full bg-surface-2 border border-border rounded-btn px-3 py-2 text-text" />
        <button onClick={create} className="bg-accent text-bg px-4 py-2 rounded-btn text-sm font-medium">Создать (pending)</button>
      </div>
      <div className="bg-surface border border-border rounded-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface-2"><tr>
            <th className="p-3 text-left text-xs text-muted">Дата</th>
            <th className="p-3 text-left text-xs text-muted">Клиент</th>
            <th className="p-3 text-left text-xs text-muted">Назначение</th>
            <th className="p-3 text-left text-xs text-muted">Сумма</th>
            <th className="p-3 text-left text-xs text-muted">Статус</th>
            <th className="p-3 text-left text-xs text-muted">Действия</th>
          </tr></thead>
          <tbody>
            {items.map(p => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-3 text-xs text-muted">{p.created_at?.slice(0,16)}</td>
                <td className="p-3">{p.client_name}</td>
                <td className="p-3 text-sm">{p.purpose}</td>
                <td className="p-3">{p.amount}</td>
                <td className="p-3"><span className={`text-xs px-2 py-1 rounded-btn ${color(p.status)}`}>{p.status}</span></td>
                <td className="p-3 flex gap-1">
                  <button onClick={() => updateStatus(p.id, "success")} className="text-xs px-2 py-1 rounded-btn bg-success/20 text-success">✓</button>
                  <button onClick={() => updateStatus(p.id, "failed")} className="text-xs px-2 py-1 rounded-btn bg-danger/20 text-danger">✗</button>
                  <button onClick={() => updateStatus(p.id, "refunded")} className="text-xs px-2 py-1 rounded-btn bg-warn/20 text-warn">↩</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <div className="p-4 text-muted text-sm">Нет платежей.</div>}
      </div>
    </div>
  );
}
