import Link from "next/link";

export default function MedicationsPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="mm-h2">药品库</h2>
          <div className="mt-1 text-sm text-zinc-600">录入名称、用量、库存与药品图片，减少认错药。</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="mm-btn-secondary" type="button">
            导入
          </button>
          <button className="mm-btn-primary" type="button">
            添加药品
          </button>
        </div>
      </div>

      <div className="mm-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-semibold">阿托伐他汀</div>
            <div className="mt-1 text-sm text-zinc-600">20mg/片 · 库存 18 片（约 18 天）</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="mm-pill">有图片</span>
              <span className="mm-pill">续方提醒：提前 5 天</span>
            </div>
          </div>
          <div className="h-14 w-14 rounded-2xl border border-zinc-200/70 bg-zinc-50" aria-hidden="true" />
        </div>

        <div className="mt-4 mm-divider" />
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="mm-btn-secondary" type="button">
            编辑
          </button>
          <button className="mm-btn-secondary" type="button">
            更新库存
          </button>
          <Link className="mm-btn-secondary" href="/plan">
            关联到计划
          </Link>
        </div>
      </div>

      <div className="mm-card text-sm text-zinc-600">
        AI 识图（占位）：后续可支持“拍药盒/药片 → 给出候选名称/规格”，但默认仅做辅助，仍需人工确认。
      </div>
    </div>
  );
}

