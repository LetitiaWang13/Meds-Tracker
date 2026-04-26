"use client";

import { useEffect, useMemo, useState } from "react";
import { mmEnsureDemoSeed, mmLoadState, type MmDose } from "@/lib/mm-store";

function monthKey(date: string) {
  // YYYY-MM
  return date.slice(0, 7);
}

function monthLabel(key: string) {
  const [y, m] = key.split("-");
  return `${y}年${m}月`;
}

export default function StatsPage() {
  const [doses, setDoses] = useState<MmDose[]>([]);

  useEffect(() => {
    mmEnsureDemoSeed();
    const sync = () => setDoses(mmLoadState().doses);
    sync();
    window.addEventListener("mm:state", sync);
    return () => window.removeEventListener("mm:state", sync);
  }, []);

  const months = useMemo(() => {
    const keys = Array.from(new Set(doses.map((d) => monthKey(d.date))));
    keys.sort().reverse();
    return keys;
  }, [doses]);

  const thisMonth = useMemo(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
  }, []);

  const [selected, setSelected] = useState<string>(thisMonth);

  useEffect(() => {
    if (months.length === 0) return;
    if (months.includes(selected)) return;
    // 如果本月没数据，则选最新的一个月
    setSelected(months[0]);
  }, [months, selected]);

  const inMonth = useMemo(() => doses.filter((d) => monthKey(d.date) === selected), [doses, selected]);

  const counts = useMemo(() => {
    const taken = inMonth.filter((d) => d.status === "taken").length;
    const skipped = inMonth.filter((d) => d.status === "skipped").length;
    const pending = inMonth.filter((d) => d.status === "pending").length;
    const total = inMonth.length;
    return { taken, skipped, pending, total };
  }, [inMonth]);

  const byMedication = useMemo(() => {
    const map = new Map<
      string,
      { medicationName: string; taken: number; skipped: number; pending: number; total: number }
    >();
    for (const d of inMonth) {
      const key = d.medicationName;
      const cur =
        map.get(key) ?? { medicationName: key, taken: 0, skipped: 0, pending: 0, total: 0 };
      cur.total += 1;
      if (d.status === "taken") cur.taken += 1;
      else if (d.status === "skipped") cur.skipped += 1;
      else cur.pending += 1;
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.taken - a.taken || b.total - a.total);
  }, [inMonth]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="mm-h2">统计</h2>
          <div className="mt-1 text-sm text-zinc-600">查看本月累计与历史记录。</div>
        </div>
        <a className="mm-btn-secondary" href="/today">
          返回今日
        </a>
      </div>

      <div className="mm-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-semibold">月份</div>
          <select className="mm-input max-w-[220px]" value={selected} onChange={(e) => setSelected(e.target.value)}>
            {months.length === 0 ? <option value={thisMonth}>{monthLabel(thisMonth)}</option> : null}
            {months.map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50 p-4">
            <div className="text-xs font-medium text-zinc-500">已服（本月）</div>
            <div className="mt-2 text-2xl font-semibold">{counts.taken}</div>
          </div>
          <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50 p-4">
            <div className="text-xs font-medium text-zinc-500">跳过（本月）</div>
            <div className="mt-2 text-2xl font-semibold">{counts.skipped}</div>
          </div>
          <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50 p-4">
            <div className="text-xs font-medium text-zinc-500">待服（当前）</div>
            <div className="mt-2 text-2xl font-semibold">{counts.pending}</div>
          </div>
          <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50 p-4">
            <div className="text-xs font-medium text-zinc-500">总次数（本月）</div>
            <div className="mt-2 text-2xl font-semibold">{counts.total}</div>
          </div>
        </div>
      </div>

      <div className="mm-card">
        <div className="text-sm font-semibold">本月按药品汇总</div>
        <div className="mt-1 text-sm text-zinc-600">每种药本月吃了多少次（已服）。</div>

        <div className="mt-4 space-y-2">
          {byMedication.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50 p-4 text-sm text-zinc-600">
              这个月暂无汇总数据。
            </div>
          ) : (
            byMedication.map((m) => (
              <div
                key={m.medicationName}
                className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200/70 bg-white p-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-zinc-900">{m.medicationName}</div>
                  <div className="mt-1 text-sm text-zinc-600">
                    已服 {m.taken} 次 · 跳过 {m.skipped} 次 · 待服 {m.pending} 次
                  </div>
                </div>
                <span className="mm-pill">已服 {m.taken}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mm-card">
        <div className="text-sm font-semibold">历史记录</div>
        <div className="mt-1 text-sm text-zinc-600">按月查看每次用药的状态（已服/跳过/待服）。</div>

        <div className="mt-4 space-y-2">
          {inMonth.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50 p-4 text-sm text-zinc-600">
              这个月暂无记录。
            </div>
          ) : (
            inMonth
              .slice()
              .sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)))
              .map((d) => (
                <div key={d.id} className="flex items-start justify-between gap-3 rounded-2xl border border-zinc-200/70 bg-white p-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-zinc-900">
                      {d.date} {d.time} · {d.medicationName}
                    </div>
                    <div className="mt-1 text-sm text-zinc-600">
                      {d.dosageText} · {d.amountPerDose} {d.unit}
                    </div>
                  </div>
                  <span className={d.status === "taken" ? "mm-pill" : d.status === "skipped" ? "mm-pill border-zinc-200 bg-zinc-50 text-zinc-700" : "mm-pill border-blue-200 bg-blue-50 text-blue-700"}>
                    {d.status === "taken" ? "已服" : d.status === "skipped" ? "跳过" : "待服"}
                  </span>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}

