"use client";
import "./globals.css";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ADMIN = [
  { href: "/admin", label: "Дашборд" },
  { href: "/schedule", label: "Расписание" },
  { href: "/clients", label: "Клиенты" },
  { href: "/leads", label: "Лиды" },
  { href: "/tasks", label: "Задачи" },
  { href: "/subscriptions", label: "Абонементы" },
  { href: "/bookings", label: "Записи" },
  { href: "/analytics", label: "Аналитика" },
  { href: "/team", label: "Команда" },
  { href: "/payments", label: "Оплаты" },
  { href: "/notifications", label: "Уведомления" },
  { href: "/settings", label: "Настройки" },
];
const NAV_TRAINER = [
  { href: "/trainer", label: "Мои занятия" },
  { href: "/schedule", label: "Расписание" },
];
const NAV_CLIENT = [
  { href: "/schedule", label: "Расписание" },
  { href: "/bookings", label: "Мои записи" },
  { href: "/subscriptions", label: "Абонемент" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<string>("");
  const pathname = usePathname();
  useEffect(() => { setRole(localStorage.getItem("role") || ""); }, [pathname]);
  const nav = role === "admin" ? NAV_ADMIN : role === "trainer" ? NAV_TRAINER : NAV_CLIENT;
  const isLogin = pathname === "/";
  if (isLogin) {
    return <html lang="ru"><body>{children}</body></html>;
  }
  return (
    <html lang="ru"><body>
      <div className="min-h-screen flex">
        <aside className="sidebar w-60 shrink-0 border-r border-border bg-surface hidden md:flex flex-col">
          <div className="p-5 text-xl font-semibold text-accent">ЧС · Студия</div>
          <nav className="flex-1 px-3 space-y-1">
            {nav.map(n => (
              <Link key={n.href} href={n.href} className={`block px-3 py-2 rounded-btn text-sm ${pathname===n.href ? "bg-surface-2 text-accent" : "text-muted hover:text-text hover:bg-surface-2"}`}>{n.label}</Link>
            ))}
          </nav>
          <div className="p-3 border-t border-border">
            <button onClick={() => { localStorage.clear(); window.location.href = "/"; }} className="w-full text-left px-3 py-2 rounded-btn text-sm text-muted hover:text-text hover:bg-surface-2">Выйти</button>
          </div>
        </aside>
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-border bg-surface flex items-center px-4 md:px-6">
            <div className="md:hidden text-accent font-semibold mr-3">ЧС</div>
            <div className="text-sm text-muted truncate">{pathname}</div>
            <div className="ml-auto text-xs text-muted">{role}</div>
          </header>
          <main className="flex-1 overflow-auto">{children}</main>
          <nav className="md:hidden border-t border-border bg-surface flex overflow-x-auto">
            {nav.map(n => (
              <Link key={n.href} href={n.href} className={`shrink-0 px-3 py-2 text-xs ${pathname===n.href ? "text-accent" : "text-muted"}`}>{n.label}</Link>
            ))}
          </nav>
        </div>
      </div>
    </body></html>
  );
}
