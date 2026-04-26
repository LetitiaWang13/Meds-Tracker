const baseUrl =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export default function CalendarPage() {
  const icalUrl = `${baseUrl.replace(/\\/$/, "")}/api/ical`;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="mm-h2">导出到系统日历</h2>
        <div className="mt-1 text-sm text-zinc-600">用系统日历来提醒：稳定、跨设备、无需后台常驻。</div>
      </div>

      <div className="mm-card">
        <div className="text-sm font-semibold">将包含的提醒</div>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50 p-4 text-sm text-zinc-700">
            <div className="font-medium text-zinc-900">用药提醒</div>
            <div className="mt-1 text-zinc-600">按每种药的时间点生成未来 30 天事件。</div>
          </div>
          <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50 p-4 text-sm text-zinc-700">
            <div className="font-medium text-zinc-900">买药/续方提醒</div>
            <div className="mt-1 text-zinc-600">按库存预测的“提前 N 天”提醒。</div>
          </div>
          <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50 p-4 text-sm text-zinc-700">
            <div className="font-medium text-zinc-900">复诊提醒</div>
            <div className="mt-1 text-zinc-600">按医生建议复诊时间（可手动录入）。</div>
          </div>
        </div>

        <div className="mt-5 mm-divider" />

        <div className="mt-5">
          <div className="text-xs font-medium text-zinc-500">下载链接（当前为示例）</div>
          <code className="mt-2 block rounded-xl border border-zinc-200/70 bg-zinc-50 p-3 text-xs text-zinc-800">
            {icalUrl}
          </code>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={icalUrl} className="mm-btn-primary">
              下载 .ics
            </a>
            <a href="https://support.apple.com/zh-cn/guide/calendar/icl1022/mac" className="mm-btn-secondary">
              iOS/ macOS 导入说明
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

