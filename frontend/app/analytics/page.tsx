"use client";
import { useEffect, useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
const API = process.env.NEXT_PUBLIC_API_URL || "https://chs-backend-oc37.onrender.com";

export default function Analytics() {
  const [summary, setSummary] = useState<any>(null);
  const [byTrainer, setByTrainer] = useState<any[]>([]);
  const [byClass, setByClass] = useState<any[]>([]);
  const [series, setSeries] = useState<any[]>([]);
  const [groupBy, setGroupBy] = useState<"day" | "month">("day");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = () => {
    const t = localStorage.getItem("token");
    const h = { Authorization: `Bearer ${t}` };
    const qs = `?${from ? "date_from=" + from : ""}${from && to ? "&" : ""}${to ? "date_to=" + to : ""}`;
    fetch(`${API}/api/v1/analytics/summary${qs}`, { headers: h }).then(r => r.json()).then(setSummary);
    fetch(`${API}/api/v1/analytics/by-trainer${qs}`, { headers: h }).then(r => r.json()).then(setByTrainer);
    fetch(`${API}/api/v1/analytics/by-class-type${qs}`, { headers: h }).then(r => r.json()).then(setByClass);
    const tsQs = `${qs}${qs.includes("?") ? "&" : "?"}group_by=${groupBy}`;
    fetch(`${API}/api/v1/analytics/timeseries${tsQs}`, { headers: h }).then(r => r.json()).then(setSeries);
  };

  useEffect(() => { load(); }, []);

  const card = (label: string, value: any) => (
    <div className="bg-surface rounded-card shadow p-4">
      <div className="text-sm text-muted">{label}</div>
      <div className="text-2xl font-semibold text-accent mt-1">{value}</div>
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold text-accent mb-4">Аналитика</h1>
      <div className="flex gap-3 mb-4 items-end flex-wrap">
        <div>
          <label className="text-sm text-muted">С</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="block border rounded px-2 py-1" />
        </div>
        <div>
          <label className="text-sm text-muted">По</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="block border rounded px-2 py-1" />
        </div>
        <div>
          <label className="text-sm text-muted">Группировка</label>
          <select value={groupBy} onChange={e => setGroupBy(e.target.value as any)} className="block border rounded px-2 py-1">
            <option value="day">По дням</option>
            <option value="month">По месяцам</option>
          </select>
        </div>
        <button onClick={load} className="bg-sage text-white px-4 py-1.5 rounded">Применить</button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {card("Занятий", summary.sessions_total)}
          {card("Записей", summary.bookings_total)}
          {card("Посещено", summary.attended)}
          {card("Неявки", summary.no_show)}
          {card("Отмены", summary.cancelled)}
          {card("Уник. клиентов", summary.unique_clients)}
          {card("Клиентов всего", summary.clients_total)}
          {card("Выручка (посещения)", summary.revenue_attendance)}
          {card("Выручка (абонементы)", summary.revenue_subscriptions_active)}
          {card("Активных абонементов", summary.subscriptions_active)}
        </div>
      )}

      <h2 className="text-lg font-semibold text-accent mb-2">Динамика посещаемости</h2>
      <div className="bg-surface rounded-card shadow p-4 mb-6">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={series}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="sessions" fill="#19B6A3" name="Занятий" />
            <Bar dataKey="bookings" fill="#397BE5" name="Записей" />
            <Bar dataKey="attended" fill="#C34B83" name="Посещено" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h2 className="text-lg font-semibold text-accent mb-2">Динамика выручки</h2>
      <div className="bg-surface rounded-card shadow p-4 mb-6">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={series}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#C85A3E" name="Выручка" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <h2 className="text-lg font-semibold text-accent mb-2">По тренерам</h2>
      <div className="bg-surface rounded-card shadow overflow-hidden mb-6">
        <table className="w-full">
          <thead className="bg-surface-2"><tr><th className="p-3 text-left">Тренер</th><th className="p-3 text-left">Занятий</th><th className="p-3 text-left">Записей</th><th className="p-3 text-left">Посещено</th></tr></thead>
          <tbody>
            {byTrainer.map(t => (
              <tr key={t.trainer_id} className="border-t border-border">
                <td className="p-3">{t.trainer_name}</td>
                <td className="p-3">{t.sessions}</td>
                <td className="p-3">{t.bookings}</td>
                <td className="p-3">{t.attended}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-lg font-semibold text-accent mb-2">По типам занятий</h2>
      <div className="bg-surface rounded-card shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface-2"><tr><th className="p-3 text-left">Тип</th><th className="p-3 text-left">Занятий</th><th className="p-3 text-left">Записей</th><th className="p-3 text-left">Посещено</th><th className="p-3 text-left">Цена</th></tr></thead>
          <tbody>
            {byClass.map(c => (
              <tr key={c.class_type_id} className="border-t border-border">
                <td className="p-3">{c.name}</td>
                <td className="p-3">{c.sessions}</td>
                <td className="p-3">{c.bookings}</td>
                <td className="p-3">{c.attended}</td>
                <td className="p-3">{c.price_single}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
