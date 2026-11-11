"use client";
import { useEffect, useState } from "react";
const API = process.env.NEXT_PUBLIC_API_URL || "https://chs-backend-oc37.onrender.com";

export default function SchedulePage() {
  const [view, setView] = useState<"day" | "week">("week");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [trainer, setTrainer] = useState("");
  const [classType, setClassType] = useState("");
  const [sessions, setSessions] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [classTypes, setClassTypes] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const t = localStorage.getItem("token");
    const h = { Authorization: `Bearer ${t}` };
    let df = date, dt = date;
    if (view === "week") {
      const d = new Date(date);
      const mon = new Date(d); mon.setDate(d.getDate() - d.getDay() + 1);
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      df = mon.toISOString().slice(0, 10);
      dt = sun.toISOString().slice(0, 10);
    }
    fetch(`${API}/api/v1/sessions?date_from=${df}&date_to=${dt}`, { headers: h }).then(r => r.json()).then((d) => {
      let list = Array.isArray(d) ? d : [];
      if (trainer) list = list.filter((s: any) => String(s.trainer_id) === trainer);
      if (classType) list = list.filter((s: any) => String(s.class_type_id) === classType);
      setSessions(list);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = localStorage.getItem("token");
    const h = { Authorization: `Bearer ${t}` };
    fetch(`${API}/api/v1/trainers`, { headers: h }).then(r => r.json()).then(setTrainers);
    fetch(`${API}/api/v1/class-types`, { headers: h }).then(r => r.json()).then(setClassTypes);
  }, []);
  useEffect(() => { load(); }, [view, date, trainer, classType]);

  async function book(id: string) {
    const t = localStorage.getItem("token");
    const r = await fetch(`${API}/api/v1/bookings?session_id=${id}`, { method: "POST", headers: { Authorization: `Bearer ${t}` } });
    setMsg(r.ok ? "Записано!" : "Ошибка записи (возможно, мест нет или уже записаны)");
    load();
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-semibold text-accent mb-4">Расписание</h1>
      <div className="flex flex-wrap gap-3 mb-4 items-end">
        <div className="flex rounded-btn overflow-hidden border border-border">
          <button onClick={() => setView("day")} className={`px-3 py-1.5 text-sm ${view === "day" ? "bg-accent text-bg" : "bg-surface-2 text-muted"}`}>День</button>
          <button onClick={() => setView("week")} className={`px-3 py-1.5 text-sm ${view === "week" ? "bg-accent text-bg" : "bg-surface-2 text-muted"}`}>Неделя</button>
        </div>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-surface-2 border border-border rounded-btn px-3 py-1.5 text-text" />
        <select value={trainer} onChange={e => setTrainer(e.target.value)} className="bg-surface-2 border border-border rounded-btn px-3 py-1.5 text-text">
          <option value="">Все тренеры</option>
          {trainers.map((tr: any) => <option key={tr.id} value={tr.id}>{tr.first_name} {tr.last_name}</option>)}
        </select>
        <select value={classType} onChange={e => setClassType(e.target.value)} className="bg-surface-2 border border-border rounded-btn px-3 py-1.5 text-text">
          <option value="">Все типы</option>
          {classTypes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      {msg && <div className="mb-3 text-success text-sm">{msg}</div>}
      {loading && <div className="text-muted">Загрузка...</div>}
      <div className="space-y-3">
        {sessions.map(s => (
          <div key={s.id} className="bg-surface border border-border rounded-card p-4 flex justify-between items-center">
            <div>
              <div className="font-mono text-xs text-muted">{new Date(s.start_at).toLocaleString("ru-RU")}</div>
              <div className="font-semibold">{s.class_type_name}</div>
              <div className="text-sm text-muted">{s.trainer_name} · {s.booked_count}/{s.capacity} мест</div>
            </div>
            <button onClick={() => book(s.id)} className="bg-accent text-bg px-4 py-2 rounded-btn text-sm font-medium">Записаться</button>
          </div>
        ))}
        {!loading && sessions.length === 0 && <div className="text-muted text-sm">Нет занятий по выбранным фильтрам.</div>}
      </div>
    </div>
  );
}