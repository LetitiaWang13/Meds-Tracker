"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { mmAddMedication, mmAdjustSupply, mmEnsureDemoSeed, mmLoadState, mmTodayKey, mmUpdateMedication, mmUpdateSupply, mmUpsertPlanForMedication, type MmMedication, type MmPlan, type MmSupply } from "@/lib/mm-store";

export default function MedicationsPage() {
  const [medications, setMedications] = useState<MmMedication[]>([]);
  const [plans, setPlans] = useState<MmPlan[]>([]);
  const [supplies, setSupplies] = useState<MmSupply[]>([]);
  const [editingMed, setEditingMed] = useState<MmMedication | null>(null);
  const [intervalDays, setIntervalDays] = useState<number>(1);
  const [times, setTimes] = useState<string[]>(["08:00"]);
  const [timeInput, setTimeInput] = useState<string>("08:00");

  const [editingInfoMed, setEditingInfoMed] = useState<MmMedication | null>(null);
  const [editName, setEditName] = useState("");
  const [editDosageText, setEditDosageText] = useState("");
  const [editAmountPerDose, setEditAmountPerDose] = useState<number>(1);
  const [editImageUrl, setEditImageUrl] = useState<string | undefined>(undefined);

  const [editingSupplyMed, setEditingSupplyMed] = useState<MmMedication | null>(null);
  const [supplyDelta, setSupplyDelta] = useState<number>(0);
  const [supplyUnit, setSupplyUnit] = useState<string>("片");
  const [supplyLeadDays, setSupplyLeadDays] = useState<number>(5);

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDosageText, setNewDosageText] = useState("");
  const [newAmountPerDose, setNewAmountPerDose] = useState<number>(1);
  const [newImageUrl, setNewImageUrl] = useState<string | undefined>(undefined);
  const [newSupplyOnHand, setNewSupplyOnHand] = useState<number>(18);
  const [newSupplyUnit, setNewSupplyUnit] = useState("片");
  const [newRefillLeadDays, setNewRefillLeadDays] = useState<number>(5);
  const [newIntervalDays, setNewIntervalDays] = useState<number>(1);
  const [newTimes, setNewTimes] = useState<string[]>(["08:00"]);
  const [newTimeInput, setNewTimeInput] = useState<string>("08:00");

  useEffect(() => {
    mmEnsureDemoSeed();
    const sync = () => {
      const s = mmLoadState();
      setMedications(s.medications);
      setPlans(s.plans);
      setSupplies(s.supplies);
    };
    sync();
    window.addEventListener("mm:state", sync);
    return () => window.removeEventListener("mm:state", sync);
  }, []);

  const planByMed = useMemo(() => {
    const map = new Map<string, MmPlan>();
    for (const p of plans) map.set(p.medicationId, p);
    return map;
  }, [plans]);

  const supplyByMed = useMemo(() => {
    const map = new Map<string, MmSupply>();
    for (const s of supplies) map.set(s.medicationId, s);
    return map;
  }, [supplies]);

  function openPlanEditor(med: MmMedication) {
    const p = planByMed.get(med.id);
    setEditingMed(med);
    setIntervalDays(p?.intervalDays ?? 1);
    const t = (p?.times?.length ? p.times : ["08:00"]).slice().sort();
    setTimes(t);
    setTimeInput(t[0] ?? "08:00");
  }

  function addTime() {
    const v = timeInput.trim();
    if (!/^\d{2}:\d{2}$/.test(v)) return;
    setTimes((prev) => Array.from(new Set([...prev, v])).sort());
  }

  function removeTime(v: string) {
    setTimes((prev) => prev.filter((t) => t !== v));
  }

  function savePlan() {
    if (!editingMed) return;
    const t = times.length ? times : ["08:00"];
    mmUpsertPlanForMedication(editingMed.id, { intervalDays, times: t }, mmTodayKey(new Date()));
    setEditingMed(null);
  }

  function openEditInfo(med: MmMedication) {
    setEditingInfoMed(med);
    setEditName(med.name);
    setEditDosageText(med.dosageText);
    setEditAmountPerDose(med.amountPerDose ?? 1);
    setEditImageUrl(med.imageUrl);
  }

  function saveEditInfo() {
    if (!editingInfoMed) return;
    mmUpdateMedication(editingInfoMed.id, {
      name: editName,
      dosageText: editDosageText,
      amountPerDose: Number(editAmountPerDose) || 1,
      imageUrl: editImageUrl
    });
    setEditingInfoMed(null);
  }

  function openSupplyEditor(med: MmMedication) {
    const s = supplyByMed.get(med.id);
    setEditingSupplyMed(med);
    setSupplyDelta(0);
    setSupplyUnit(s?.unit ?? "片");
    setSupplyLeadDays(s?.refillLeadDays ?? 5);
  }

  function applySupplyDelta() {
    if (!editingSupplyMed) return;
    const delta = Math.floor(Number(supplyDelta) || 0);
    if (delta !== 0) mmAdjustSupply(editingSupplyMed.id, delta);
    mmUpdateSupply(editingSupplyMed.id, { unit: supplyUnit, refillLeadDays: supplyLeadDays });
    setEditingSupplyMed(null);
  }

  function openAdd() {
    setAdding(true);
    setNewName("");
    setNewDosageText("");
    setNewAmountPerDose(1);
    setNewImageUrl(undefined);
    setNewSupplyOnHand(18);
    setNewSupplyUnit("片");
    setNewRefillLeadDays(5);
    setNewIntervalDays(1);
    setNewTimes(["08:00"]);
    setNewTimeInput("08:00");
  }

  function addNewTime() {
    const v = newTimeInput.trim();
    if (!/^\d{2}:\d{2}$/.test(v)) return;
    setNewTimes((prev) => Array.from(new Set([...prev, v])).sort());
  }

  function removeNewTime(v: string) {
    setNewTimes((prev) => prev.filter((t) => t !== v));
  }

  async function onPickImage(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : undefined;
      setNewImageUrl(result);
    };
    reader.readAsDataURL(file);
  }

  async function onPickEditImage(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : undefined;
      setEditImageUrl(result);
    };
    reader.readAsDataURL(file);
  }

  function saveNewMedication() {
    const name = newName.trim();
    const dosage = newDosageText.trim();
    if (!name || !dosage) return;

    mmAddMedication({
      name,
      dosageText: dosage,
      amountPerDose: Number(newAmountPerDose) || 1,
      imageUrl: newImageUrl,
      intervalDays: newIntervalDays,
      times: newTimes.length ? newTimes : ["08:00"],
      supplyOnHand: newSupplyOnHand,
      supplyUnit: newSupplyUnit,
      refillLeadDays: newRefillLeadDays
    });
    setAdding(false);
  }

  function imgProps(src?: string) {
    const url = src || "/demo/med-3.png";
    return {
      src: url,
      unoptimized: url.startsWith("data:")
    };
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="mm-h2">药品库</h2>
          <div className="mt-1 text-sm text-zinc-600">录入名称、用量、库存与药品图片，减少认错药。</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="mm-btn-primary" type="button" onClick={openAdd}>
            添加药品
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {medications.map((m) => {
          const p = planByMed.get(m.id);
          const s = supplyByMed.get(m.id);
          const intervalText = p?.intervalDays && p.intervalDays > 1 ? `每隔 ${p.intervalDays} 天` : "每天";
          const timeText = (p?.times?.length ? p.times : ["08:00"]).slice().sort().join("、");

          return (
            <div key={m.id} className="mm-card">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{m.name}</div>
                  <div className="mt-1 text-sm text-zinc-600">
                    {m.dosageText} · {intervalText} · {timeText}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="mm-pill">
                      {Number.isFinite(m.amountPerDose) ? m.amountPerDose : 1} {s?.unit || "片"}/次
                    </span>
                    <span className="mm-pill">库存：{s ? `${s.onHand} ${s.unit}` : "—"}</span>
                  </div>
                </div>
                <Image
                  {...imgProps(m.imageUrl)}
                  alt="药品图片"
                  width={56}
                  height={56}
                  className="h-14 w-14 shrink-0 rounded-2xl border border-zinc-200/70 object-cover"
                />
              </div>

              <div className="mt-4 mm-divider" />
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="mm-btn-secondary" type="button" onClick={() => openEditInfo(m)}>
                  编辑
                </button>
                <button className="mm-btn-secondary" type="button" onClick={() => openSupplyEditor(m)}>
                  更新库存
                </button>
                <button className="mm-btn-secondary" type="button" onClick={() => openPlanEditor(m)}>
                  用药计划
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mm-card text-sm text-zinc-600">
        AI 识图（占位）：后续可支持“拍药盒/药片 → 给出候选名称/规格”，但默认仅做辅助，仍需人工确认。
      </div>

      {editingMed ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-xl shadow-zinc-900/15">
            <div className="text-base font-semibold">用药计划</div>
            <div className="mt-1 text-sm text-zinc-600">设置隔几天吃、以及每天几点吃。</div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block">
                <div className="text-xs font-medium text-zinc-500">间隔</div>
                <select
                  className="mt-2 mm-input"
                  value={intervalDays}
                  onChange={(e) => setIntervalDays(Number(e.target.value))}
                >
                  <option value={1}>每天</option>
                  <option value={2}>每隔 2 天</option>
                  <option value={3}>每隔 3 天</option>
                  <option value={4}>每隔 4 天</option>
                  <option value={5}>每隔 5 天</option>
                  <option value={7}>每隔 7 天</option>
                </select>
              </label>

              <label className="block">
                <div className="text-xs font-medium text-zinc-500">用药时间</div>
                <div className="mt-2 flex gap-2">
                  <input className="mm-input" type="time" value={timeInput} onChange={(e) => setTimeInput(e.target.value)} />
                  <button className="mm-btn-secondary shrink-0" type="button" onClick={addTime}>
                    添加
                  </button>
                </div>
              </label>
            </div>

            <div className="mt-4">
              <div className="text-xs font-medium text-zinc-500">已设置时间点</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {times.length === 0 ? (
                  <span className="text-sm text-zinc-600">暂无，保存时会默认 08:00</span>
                ) : (
                  times.map((t) => (
                    <button key={t} type="button" className="mm-pill" onClick={() => removeTime(t)} title="点击移除">
                      {t} ×
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button className="mm-btn-secondary flex-1" type="button" onClick={() => setEditingMed(null)}>
                取消
              </button>
              <button className="mm-btn-primary flex-1" type="button" onClick={savePlan}>
                保存
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editingInfoMed ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center">
          <div className="w-full max-w-xl rounded-3xl bg-white shadow-xl shadow-zinc-900/15">
            <div className="px-4 pb-2 pt-4">
              <div className="text-base font-semibold">编辑药品</div>
              <div className="mt-1 text-sm text-zinc-600">可修改药品基础信息（名称/规格/每次用量/图片）。</div>
            </div>

            <div className="max-h-[72vh] space-y-4 overflow-y-auto px-4 pb-4">
              <div className="grid gap-3">
                <label className="block">
                  <div className="text-xs font-medium text-zinc-500">药品名称</div>
                  <input className="mt-2 mm-input" value={editName} onChange={(e) => setEditName(e.target.value)} />
                </label>

                <label className="block">
                  <div className="text-xs font-medium text-zinc-500">规格</div>
                  <input className="mt-2 mm-input" value={editDosageText} onChange={(e) => setEditDosageText(e.target.value)} />
                </label>

                <label className="block">
                  <div className="text-xs font-medium text-zinc-500">每次用量</div>
                  <input
                    className="mt-2 mm-input"
                    type="number"
                    min={0}
                    step={1}
                    value={Number.isFinite(editAmountPerDose) ? editAmountPerDose : 1}
                    onChange={(e) => setEditAmountPerDose(Number(e.target.value))}
                  />
                </label>

                <div className="block">
                  <div className="text-xs font-medium text-zinc-500">图片</div>
                  <div className="mt-2 flex items-center gap-3">
                    <Image
                      {...imgProps(editImageUrl)}
                      alt="药品图片预览"
                      width={56}
                      height={56}
                      className="h-14 w-14 shrink-0 rounded-2xl border border-zinc-200/70 object-cover"
                    />
                    <input
                      className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-xl file:border file:border-zinc-200 file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium file:text-zinc-900 hover:file:bg-zinc-50"
                      type="file"
                      accept="image/*"
                      onChange={(e) => onPickEditImage(e.target.files?.[0] ?? null)}
                    />
                  </div>
                  <div className="mt-2 rounded-2xl border border-zinc-200/70 bg-zinc-50 p-3 text-sm text-zinc-600">
                    AI 识图（占位）：后续可在这里展示识别结果与一键填充。
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-200/70 bg-white px-4 py-3">
              <div className="flex gap-2">
                <button className="mm-btn-secondary flex-1" type="button" onClick={() => setEditingInfoMed(null)}>
                  取消
                </button>
                <button className="mm-btn-primary flex-1" type="button" onClick={saveEditInfo} disabled={!editName.trim() || !editDosageText.trim()}>
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {editingSupplyMed ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-xl shadow-zinc-900/15">
            <div className="px-4 pb-2 pt-4">
              <div className="text-base font-semibold">更新库存</div>
              <div className="mt-1 text-sm text-zinc-600">仅修改库存：支持增加或减少，并同步全站。</div>
            </div>

            <div className="space-y-4 px-4 pb-4">
              <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50 p-4">
                <div className="text-sm font-semibold">{editingSupplyMed.name}</div>
                <div className="mt-1 text-sm text-zinc-600">
                  当前库存：{supplyByMed.get(editingSupplyMed.id)?.onHand ?? 0} {supplyUnit}
                </div>
                <div className="mt-2 text-sm text-zinc-600">
                  本次调整：
                  <span className={supplyDelta < 0 ? "ml-1 font-semibold text-zinc-900" : "ml-1 font-semibold text-zinc-900"}>
                    {supplyDelta > 0 ? `+${supplyDelta}` : supplyDelta}
                  </span>{" "}
                  {supplyUnit}
                </div>
              </div>

              <div className="grid gap-3">
                <label className="block">
                  <div className="flex items-center justify-between text-xs font-medium text-zinc-500">
                    <span>减</span>
                    <span>数量</span>
                    <span>增</span>
                  </div>
                  <input
                    className="mt-2 w-full accent-zinc-900"
                    type="range"
                    min={-50}
                    max={50}
                    step={1}
                    value={Number.isFinite(supplyDelta) ? supplyDelta : 0}
                    onChange={(e) => setSupplyDelta(Number(e.target.value))}
                  />
                  <div className="mt-2 flex items-center justify-center">
                    <span className="mm-pill">
                      {supplyDelta > 0 ? `增加 ${supplyDelta}` : supplyDelta < 0 ? `减少 ${Math.abs(supplyDelta)}` : "不调整"}
                    </span>
                  </div>
                </label>

                <label className="block">
                  <div className="text-xs font-medium text-zinc-500">单位</div>
                  <input className="mt-2 mm-input" value={supplyUnit} onChange={(e) => setSupplyUnit(e.target.value)} placeholder="片/粒/支" />
                </label>

                <label className="block">
                  <div className="text-xs font-medium text-zinc-500">提前提醒天数</div>
                  <select className="mt-2 mm-input" value={supplyLeadDays} onChange={(e) => setSupplyLeadDays(Number(e.target.value))}>
                    <option value={3}>提前 3 天</option>
                    <option value={5}>提前 5 天</option>
                    <option value={7}>提前 7 天</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="border-t border-zinc-200/70 bg-white px-4 py-3">
              <div className="flex gap-2">
                <button className="mm-btn-secondary flex-1" type="button" onClick={() => setEditingSupplyMed(null)}>
                  取消
                </button>
                <button className="mm-btn-primary flex-1" type="button" onClick={applySupplyDelta}>
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {adding ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center">
          <div className="w-full max-w-xl rounded-3xl bg-white shadow-xl shadow-zinc-900/15">
            <div className="px-4 pb-2 pt-4">
              <div className="text-base font-semibold">添加药品</div>
              <div className="mt-1 text-sm text-zinc-600">填写药品信息、库存与用药计划。</div>
            </div>

            <div className="max-h-[72vh] space-y-4 overflow-y-auto px-4 pb-4">
              <div className="grid gap-3">
              <label className="block">
                <div className="text-xs font-medium text-zinc-500">药品名称</div>
                <input className="mt-2 mm-input" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="例如：阿托伐他汀" />
              </label>

              <label className="block">
                <div className="text-xs font-medium text-zinc-500">规格</div>
                <input className="mt-2 mm-input" value={newDosageText} onChange={(e) => setNewDosageText(e.target.value)} placeholder="例如：20mg" />
              </label>

              <label className="block">
                <div className="text-xs font-medium text-zinc-500">每次用量</div>
                <input
                  className="mt-2 mm-input"
                  type="number"
                  min={0}
                  step={1}
                  value={Number.isFinite(newAmountPerDose) ? newAmountPerDose : 1}
                  onChange={(e) => setNewAmountPerDose(Number(e.target.value))}
                  placeholder="例如：1 / 2 / 0.5"
                />
                <div className="mt-2 text-sm text-zinc-600">
                  单位将使用库存的单位：<span className="font-semibold text-zinc-900">{newSupplyUnit || "片"}</span>
                </div>
              </label>

              <div className="block">
                <div className="text-xs font-medium text-zinc-500">图片</div>
                <div className="mt-2 flex items-center gap-3">
                  <Image
                    {...imgProps(newImageUrl)}
                    alt="药品图片预览"
                    width={56}
                    height={56}
                    className="h-14 w-14 shrink-0 rounded-2xl border border-zinc-200/70 object-cover"
                  />
                  <input
                    className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-xl file:border file:border-zinc-200 file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium file:text-zinc-900 hover:file:bg-zinc-50"
                    type="file"
                    accept="image/*"
                    onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
                  />
                </div>
                <div className="mt-2 rounded-2xl border border-zinc-200/70 bg-zinc-50 p-3 text-sm text-zinc-600">
                  AI 识图（占位）：后续接入“拍照 → 自动识别药品名称/规格”，这里会显示识别结果与一键填充。
                </div>
              </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50 p-4">
                <div className="text-sm font-semibold">用药计划</div>
                <div className="mt-3 grid gap-4">
                  <label className="block">
                    <div className="text-xs font-medium text-zinc-500">间隔</div>
                    <select className="mt-2 mm-input" value={newIntervalDays} onChange={(e) => setNewIntervalDays(Number(e.target.value))}>
                      <option value={1}>每天</option>
                      <option value={2}>每隔 2 天</option>
                      <option value={3}>每隔 3 天</option>
                      <option value={4}>每隔 4 天</option>
                      <option value={5}>每隔 5 天</option>
                      <option value={7}>每隔 7 天</option>
                    </select>
                  </label>

                  <label className="block">
                    <div className="text-xs font-medium text-zinc-500">用药时间</div>
                    <div className="mt-2 flex gap-2">
                      <input className="mm-input" type="time" value={newTimeInput} onChange={(e) => setNewTimeInput(e.target.value)} />
                      <button className="mm-btn-secondary shrink-0" type="button" onClick={addNewTime}>
                        添加
                      </button>
                    </div>
                  </label>

                  <div>
                    <div className="text-xs font-medium text-zinc-500">已设置时间点</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {newTimes.length === 0 ? (
                        <span className="text-sm text-zinc-600">暂无，保存时会默认 08:00</span>
                      ) : (
                        newTimes.map((t) => (
                          <button key={t} type="button" className="mm-pill" onClick={() => removeNewTime(t)} title="点击移除">
                            {t} ×
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

                <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50 p-4">
                <div className="text-sm font-semibold">库存</div>
                <div className="mt-3 grid gap-4">
                  <label className="block">
                    <div className="text-xs font-medium text-zinc-500">当前库存</div>
                    <input
                      className="mt-2 mm-input"
                      type="number"
                      min={0}
                      value={Number.isFinite(newSupplyOnHand) ? newSupplyOnHand : 0}
                      onChange={(e) => setNewSupplyOnHand(Number(e.target.value))}
                    />
                  </label>

                  <label className="block">
                    <div className="text-xs font-medium text-zinc-500">单位</div>
                    <input className="mt-2 mm-input" value={newSupplyUnit} onChange={(e) => setNewSupplyUnit(e.target.value)} placeholder="片/粒/支" />
                  </label>

                  <label className="block">
                    <div className="text-xs font-medium text-zinc-500">提前提醒天数</div>
                    <select className="mt-2 mm-input" value={newRefillLeadDays} onChange={(e) => setNewRefillLeadDays(Number(e.target.value))}>
                      <option value={3}>提前 3 天</option>
                      <option value={5}>提前 5 天</option>
                      <option value={7}>提前 7 天</option>
                    </select>
                  </label>
                </div>
              </div>
            </div>
            </div>

            <div className="border-t border-zinc-200/70 bg-white px-4 py-3">
              <div className="flex gap-2">
                <button className="mm-btn-secondary flex-1" type="button" onClick={() => setAdding(false)}>
                  取消
                </button>
                <button className="mm-btn-primary flex-1" type="button" onClick={saveNewMedication} disabled={!newName.trim() || !newDosageText.trim()}>
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

