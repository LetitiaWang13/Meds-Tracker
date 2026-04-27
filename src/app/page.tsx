"use client";

import { useEffect, useMemo, useState } from "react";
import { mmEnsureDemoSeed, mmLoadState, mmTodayKey, type MmDose } from "@/lib/mm-store";

export default function HomePage() {
  const now = new Date();
  const dateText = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  }).format(now);

  const [doses, setDoses] = useState<MmDose[]>([]);

  useEffect(() => {
    mmEnsureDemoSeed();
    const sync = () => setDoses(mmLoadState().doses);
    sync();
    window.addEventListener("mm:state", sync);
    return () => window.removeEventListener("mm:state", sync);
  }, []);

  const today = useMemo(() => mmTodayKey(new Date()), []);
  const todaysAll = useMemo(() => doses.filter((d) => d.date === today), [doses, today]);
  const todaysPending = useMemo(() => todaysAll.filter((d) => d.status === "pending"), [todaysAll]);
  const todaysDone = useMemo(() => todaysAll.filter((d) => d.status !== "pending"), [todaysAll]);

  const medProgress = { done: todaysDone.length, total: todaysAll.length };
  const medTodos = todaysPending
    .slice()
    .sort((a, b) => a.time.localeCompare(b.time))
    .slice(0, 3)
    .map((d) => ({
      time: d.time,
      name: d.medicationName,
      detail: `${d.dosageText} · ${d.amountPerDose} ${d.unit}`
    }));

  const refillAlerts = [
    { name: "氨氯地平片", left: 1, unit: "片", lead: 5, severity: "warn" as const },
    { name: "瑞舒伐他汀钙片", left: 18, unit: "片", lead: 5, severity: "warn" as const }
  ] as const;

  const followups = [
    { title: "心内科复诊", when: "今日 14:30", status: "today" as const },
    { title: "血脂复查（预约）", when: "明日 09:00", status: "upcoming" as const }
  ] as const;

  const percent =
    medProgress.total === 0 ? 0 : Math.round((medProgress.done / medProgress.total) * 100);

  const dateOnly = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  function estimateRunOutDate(leftDays: number) {
    const d = new Date(now);
    d.setDate(d.getDate() + Math.max(0, leftDays));
    return dateOnly.format(d);
  }

  function parseTodayTime(text: string) {
    // 支持 "今日 14:30" / "14:30"
    const m = text.match(/(\d{1,2}):(\d{2})/);
    if (!m) return null;
    const h = Number(m[1]);
    const min = Number(m[2]);
    const d = new Date(now);
    d.setHours(h, min, 0, 0);
    return d;
  }

  const agendaItems = [
    ...followups
      .filter((f) => f.status === "today")
      .map((f) => {
        const at = parseTodayTime(f.when) ?? new Date(now);
        return {
          key: `followup-${f.title}-${f.when}`,
          title: "今日复查/预约",
          detail: `${f.title} · ${f.when}`,
          href: "/followups",
          tone: "warn" as const,
          at
        };
      }),
    ...refillAlerts
      .filter((r) => r.left <= 1)
      .map((r) => {
        // 买药：默认当作“今天随时可做”，为了“下一件事”排序，给一个建议处理时间（18:00）
        const at = new Date(now);
        at.setHours(18, 0, 0, 0);
        return {
          key: `refill-${r.name}`,
          title: "今日必须买药/续方",
          detail: `${r.name} · 剩余 ${r.left}${r.unit}（最后一顿）`,
          href: "/medications",
          tone: "danger" as const,
          at
        };
      })
  ]
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .map((x) => ({
      ...x,
      timeText: new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit" }).format(x.at)
    }));

  const nextAgendaKey =
    agendaItems.find((a) => a.at.getTime() >= now.getTime())?.key ?? null;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="mm-h1">{dateText}</div>
        <div className="text-sm text-zinc-500">今日待办</div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="mm-card">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold">今日用药进度</div>
              <div className="mt-1 text-sm text-zinc-600">
                已完成 <span className="font-semibold text-zinc-900">{medProgress.done}</span> / {medProgress.total}
              </div>
            </div>
            <span className="mm-pill">{percent}%</span>
          </div>

          <div className="mt-4">
            <div className="h-2 w-full rounded-full bg-zinc-100">
              <div
                className="h-2 rounded-full bg-blue-600"
                style={{ width: `${percent}%` }}
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="mt-5 mm-divider" />
          <div className="mt-5 flex flex-wrap gap-2">
            <a className="mm-btn-primary" href="/today">
              去打卡
            </a>
            <a className="mm-btn-secondary" href="/calendar">
              导出提醒到日历
            </a>
          </div>
        </div>

        <div className="mm-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold">今日行程</div>
            </div>
            <span className="mm-pill">{agendaItems.length}</span>
          </div>

          <div className="mt-4 space-y-3">
            {agendaItems.length === 0 ? (
              <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50 p-4 text-sm text-zinc-600">
                今天没有必须到点处理的行程。
              </div>
            ) : (
              agendaItems.map((a) => (
                <a
                  key={a.key}
                  href={a.href}
                  className={[
                    "block rounded-2xl border p-4 transition-colors",
                    a.key === nextAgendaKey
                      ? "border-blue-200 bg-blue-50 hover:bg-blue-100/70"
                      : "border-zinc-200/70 bg-white hover:bg-zinc-50"
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-zinc-900">{a.title}</div>
                      <div className="mt-1 truncate text-sm text-zinc-700">
                        <span className="mr-2 inline-flex items-center rounded-full bg-white/70 px-2 py-0.5 text-xs font-semibold text-zinc-700">
                          {a.timeText}
                        </span>
                        {a.detail}
                      </div>
                    </div>
                  </div>
                </a>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="mm-card-compact flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">待服药</div>
              <div className="mt-1 text-sm text-zinc-600">{medTodos.length} 项</div>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {medTodos.map((t) => (
              <div key={`${t.time}-${t.name}`} className="flex items-start justify-between gap-3">
                <div className="mm-time-pill">{t.time}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-zinc-900">{t.name}</div>
                  <div className="truncate text-sm text-zinc-600">{t.detail}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-auto pt-4">
            <a className="mm-btn-secondary w-full" href="/today">
              查看今日列表
            </a>
          </div>
        </div>

        <div className="mm-card-compact flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">该买药/续方</div>
              <div className="mt-1 text-sm text-zinc-600">{refillAlerts.length} 项</div>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {refillAlerts.map((r) => (
              <div key={r.name} className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-zinc-900">{r.name}</div>
                  <div className="text-sm text-zinc-600">
                    预计吃完：{estimateRunOutDate(r.left)}（建议提前 {r.lead} 天处理）
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-zinc-500">剩余</div>
                  <div className={r.severity === "warn" ? "text-sm font-semibold text-orange-600" : "text-sm font-semibold text-zinc-900"}>
                    {r.left} {r.unit}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-auto pt-4">
            <a className="mm-btn-secondary w-full" href="/medications">
              去药品库更新库存
            </a>
          </div>
        </div>

        <div className="mm-card-compact flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">复查 / 预约</div>
              <div className="mt-1 text-sm text-zinc-600">{followups.length} 项</div>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {followups.map((f) => (
              <div
                key={`${f.title}-${f.when}`}
                className={[
                  "flex items-start justify-between gap-3 rounded-2xl border p-3",
                  f.status === "today"
                    ? "border-orange-200 bg-orange-50"
                    : "border-zinc-200/70 bg-white"
                ].join(" ")}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-zinc-900">{f.title}</div>
                  <div className="truncate text-sm text-zinc-600">{f.when}</div>
                </div>
                <span className={f.status === "today" ? "mm-pill border-orange-200 bg-orange-50 text-orange-700" : "mm-pill"}>
                  {f.status === "today" ? "今天" : "待办"}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-auto pt-4">
            <a className="mm-btn-secondary w-full" href="/followups">
              去复诊计划
            </a>
          </div>
        </div>
      </section>

      <button className="mm-fab" type="button" aria-label="添加">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

