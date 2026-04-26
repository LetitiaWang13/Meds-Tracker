import Link from "next/link";

export default function PlanPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="mm-h2">用药计划</h2>
          <div className="mt-1 text-sm text-zinc-600">按“药品”配置每天的时间点与每次用量。</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/medications" className="mm-btn-secondary">
            去药品库
          </Link>
          <Link href="/plan/new" className="mm-btn-primary">
            新建计划
          </Link>
        </div>
      </div>

      <div className="mm-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold">示例计划</div>
            <div className="mt-1 text-sm text-zinc-600">阿托伐他汀 · 20mg/片 · 每晚 20:00 · 每次 1 片</div>
          </div>
          <span className="mm-pill">占位</span>
        </div>
        <div className="mt-4 mm-divider" />
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="mm-btn-secondary" type="button">
            编辑
          </button>
          <button className="mm-btn-secondary" type="button">
            调整时间点
          </button>
          <button className="mm-btn-secondary" type="button">
            删除
          </button>
        </div>
      </div>
    </div>
  );
}

