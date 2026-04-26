"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { mmCanUndo, mmEnsureDemoSeed, mmLoadState, mmResetToDemo, mmSortDoses, mmTodayKey, mmUndoLastAction, mmUpdateDose, type MmDose } from "@/lib/mm-store";

export default function TodayPage() {
  const [now, setNow] = useState(() => new Date());
  const [doses, setDoses] = useState<MmDose[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [delayFor, setDelayFor] = useState<MmDose | null>(null);
  const [delayTime, setDelayTime] = useState<string>("08:00");
  const [skipFor, setSkipFor] = useState<MmDose | null>(null);

  useEffect(() => {
    mmEnsureDemoSeed();
    const sync = () => {
      const s = mmLoadState();
      setDoses(s.doses);
      setCanUndo(mmCanUndo());
    };
    sync();

    const t = window.setInterval(() => setNow(new Date()), 60_000);
    window.addEventListener("mm:state", sync);
    return () => {
      window.clearInterval(t);
      window.removeEventListener("mm:state", sync);
    };
  }, []);

  const today = useMemo(() => mmTodayKey(now), [now]);

  const todaysVisible = useMemo(() => {
    // “跳过”会从列表消失；“已服”保留在列表里（仅从“待吃/未完成”里消失）
    return doses
      .filter((d) => d.date === today && d.status !== "skipped")
      .slice()
      .sort(mmSortDoses);
  }, [doses, today]);

  function onTaken(d: MmDose) {
    mmUpdateDose(d.id, { status: "taken" });
  }

  function onDelay(d: MmDose) {
    setDelayFor(d);
    setDelayTime(d.time);
  }

  function confirmDelay() {
    if (!delayFor) return;
    mmUpdateDose(delayFor.id, { time: delayTime });
    setDelayFor(null);
  }

  function onSkip(d: MmDose) {
    setSkipFor(d);
  }

  function confirmSkip() {
    if (!skipFor) return;
    mmUpdateDose(skipFor.id, { status: "skipped" });
    setSkipFor(null);
  }

  function onUndo() {
    mmUndoLastAction();
  }

  function onReset() {
    const ok = window.confirm("确认重置？将清空当前本地数据并恢复到示例初始状态。");
    if (!ok) return;
    mmResetToDemo();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="mm-h2">今日</h2>
          <div className="mt-1 text-sm text-zinc-600">按时间顺序展示今天要吃的药，支持快速打卡。</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="mm-btn-secondary" type="button" onClick={onUndo} disabled={!canUndo}>
            撤回操作
          </button>
          <button className="mm-btn-secondary" type="button" onClick={onReset}>
            重置数据
          </button>
          <a className="mm-btn-secondary" href="/stats">
            查看统计
          </a>
        </div>
      </div>

      {todaysVisible.length === 0 ? (
        <div className="mm-card text-sm text-zinc-600">今天没有待服用的用药项。</div>
      ) : (
        <section className="space-y-3">
          {todaysVisible.map((d) => (
            <div key={d.id} className="mm-card-compact">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <Image
                    src={d.imageUrl || "/demo/med-3.png"}
                    alt="药品图片"
                    width={56}
                    height={56}
                    className="h-14 w-14 shrink-0 rounded-2xl border border-zinc-200/70 object-cover"
                    unoptimized={(d.imageUrl || "").startsWith("data:")}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{d.time}</div>
                    <div className="mt-2 truncate text-sm text-zinc-600">
                      {d.medicationName} · {d.dosageText} · {d.amountText}
                    </div>
                  </div>
                </div>

                <div className="flex w-[240px] shrink-0 flex-wrap justify-end gap-2">
                  {d.status === "taken" ? (
                    <button className="mm-btn-primary" type="button" disabled>
                      已服
                    </button>
                  ) : (
                    <>
                      <button className="mm-btn-secondary" type="button" onClick={() => onTaken(d)}>
                        已服
                      </button>
                      <button className="mm-btn-secondary" type="button" onClick={() => onDelay(d)}>
                        延后
                      </button>
                      <button className="mm-btn-secondary" type="button" onClick={() => onSkip(d)}>
                        跳过
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {delayFor ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-xl shadow-zinc-900/15">
            <div className="text-base font-semibold">延后本次用药</div>
            <div className="mt-1 text-sm text-zinc-600">
              仅修改这一条：{delayFor.medicationName}（原时间 {delayFor.time}）
            </div>
            <label className="mt-4 block">
              <div className="text-xs font-medium text-zinc-500">新的时间</div>
              <input
                className="mt-2 mm-input"
                type="time"
                value={delayTime}
                onChange={(e) => setDelayTime(e.target.value)}
              />
            </label>
            <div className="mt-5 flex gap-2">
              <button className="mm-btn-secondary flex-1" type="button" onClick={() => setDelayFor(null)}>
                取消
              </button>
              <button className="mm-btn-primary flex-1" type="button" onClick={confirmDelay}>
                确认
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {skipFor ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-xl shadow-zinc-900/15">
            <div className="text-base font-semibold">确认跳过？</div>
            <div className="mt-1 text-sm text-zinc-600">
              跳过后本次用药将从列表中消失：{skipFor.time} · {skipFor.medicationName}
            </div>
            <div className="mt-5 flex gap-2">
              <button className="mm-btn-secondary flex-1" type="button" onClick={() => setSkipFor(null)}>
                取消
              </button>
              <button className="mm-btn flex-1 bg-zinc-900 text-white hover:bg-zinc-800" type="button" onClick={confirmSkip}>
                确认跳过
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

