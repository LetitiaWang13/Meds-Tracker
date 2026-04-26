export default function FollowUpsPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="mm-h2">复诊提醒</h2>
          <div className="mt-1 text-sm text-zinc-600">手动录入医生建议的复诊时间，并导出到系统日历提醒。</div>
        </div>
        <button className="mm-btn-primary" type="button">
          添加复诊
        </button>
      </div>

      <div className="mm-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold">心内科复诊</div>
            <div className="mt-1 text-sm text-zinc-600">2026-05-20 09:30</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="mm-pill">提前 1 天提醒</span>
              <span className="mm-pill">占位</span>
            </div>
          </div>
          <span className="mm-pill">示例</span>
        </div>

        <div className="mt-4 mm-divider" />
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="mm-btn-secondary" type="button">
            编辑
          </button>
          <button className="mm-btn-secondary" type="button">
            删除
          </button>
        </div>
      </div>

      <div className="mm-card-compact text-sm text-zinc-600">
        小提示：复诊提醒与买药/续方提醒都会在「导出」里统一生成 `.ics` 事件。
      </div>
    </div>
  );
}

