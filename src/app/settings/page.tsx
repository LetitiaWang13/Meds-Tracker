"use client";

import { mmResetToDemo } from "@/lib/mm-store";

export default function SettingsPage() {
  function onReset() {
    const ok = window.confirm("确认重置？将清空当前本地数据并恢复到示例初始状态。");
    if (!ok) return;
    mmResetToDemo();
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="mm-h2">设置</h2>
        <div className="mt-1 text-sm text-zinc-600">时区、提醒提前量、数据导出/清空等。</div>
      </div>

      <div className="mm-card">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <div className="text-xs font-medium text-zinc-500">时区</div>
            <select className="mt-2 mm-input" defaultValue="Asia/Shanghai">
              <option value="Asia/Shanghai">Asia/Shanghai（中国）</option>
              <option value="Asia/Hong_Kong">Asia/Hong_Kong</option>
              <option value="Asia/Taipei">Asia/Taipei</option>
              <option value="America/Los_Angeles">America/Los_Angeles</option>
            </select>
          </label>

          <label className="block">
            <div className="text-xs font-medium text-zinc-500">买药/续方提醒提前天数</div>
            <select className="mt-2 mm-input" defaultValue="5">
              <option value="3">提前 3 天</option>
              <option value="5">提前 5 天</option>
              <option value="7">提前 7 天</option>
            </select>
          </label>
        </div>

        <div className="mt-5 mm-divider" />
        <div className="mt-5 flex flex-wrap gap-2">
          <button className="mm-btn-secondary" type="button">
            导出数据（占位）
          </button>
          <button className="mm-btn-secondary" type="button" onClick={onReset}>
            重置为示例数据
          </button>
        </div>
      </div>
    </div>
  );
}

