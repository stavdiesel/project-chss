"use client";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function AnalyticsCharts({ series }: { series: any[] }) {
  return (
    <>
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
    </>
  );
}