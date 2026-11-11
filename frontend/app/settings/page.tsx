"use client";
import { useEffect, useState } from "react";

const DEFAULTS = {
  cancel_deadline_hours: "3",
  debit_rule: "при посещении",
  salary_formula: "требует настройки",
  payment_provider: "не подключён",
  notification_channels: "telegram, email (не подключены)",
};

export default function SettingsPage() {
  const [vals, setVals] = useState(DEFAULTS);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("chs_settings");
    if (saved) setVals({ ...DEFAULTS, ...JSON.parse(saved) });
  }, []);

  const save = () => {
    localStorage.setItem("chs_settings", JSON.stringify(vals));
    setMsg("Сохранено локально (демо). Правила требуют согласования с владельцем студии.");
  };

  const field = (key: keyof typeof DEFAULTS, label: string, hint: string) => (
    <div className="mb-4">
      <label className="block text-sm text-muted mb-1">{label}</label>
      <input value={vals[key]} onChange={e => setVals({ ...vals, [key]: e.target.value })} className="w-full bg-surface-2 border border-border rounded-btn px-3 py-2 text-text" />
      <div className="text-xs text-muted mt-1">{hint}</div>
    </div>
  );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold text-accent mb-4">Настройки</h1>
      <div className="text-xs text-muted mb-4">Правила, которые клиент ещё не подтвердил, помечены как «требует настройки». Не придумываем их — запрашиваем у владельца.</div>
      {msg && <div className="mb-3 text-success text-sm">{msg}</div>}
      <div className="bg-surface border border-border rounded-card p-6">
        {field("cancel_deadline_hours", "Срок отмены (часов)", "2 или 3 часа; можно разный для разных занятий. Требует согласования.")}
        {field("debit_rule", "Списание занятия", "при записи / после посещения / при неявке. Требует согласования.")}
        {field("salary_formula", "Формула зарплаты тренеров", "ставка/процент/правила — требует настройки.")}
        {field("payment_provider", "Платёжный провайдер", "не подключён — требует настройки.")}
        {field("notification_channels", "Каналы уведомлений", "MAX/Telegram/email — требуют подтверждённой интеграции.")}
        <button onClick={save} className="bg-accent text-bg px-4 py-2 rounded-btn text-sm font-medium">Сохранить</button>
      </div>
    </div>
  );
}
