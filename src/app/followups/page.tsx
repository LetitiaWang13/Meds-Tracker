"use client";

import { useEffect, useMemo, useState } from "react";
import { mmAddFollowup, mmDeleteFollowup, mmEnsureDemoSeed, mmFlattenFollowupAppointments, mmLoadState, mmUpdateFollowup, type MmFollowup } from "@/lib/mm-store";

function formatLocal(atLocal: string) {
  // yyyy-MM-ddTHH:mm -> yyyy-MM-dd HH:mm
  return atLocal.replace("T", " ");
}

export default function FollowUpsPage() {
  const [followups, setFollowups] = useState<MmFollowup[]>([]);

  const [adding, setAdding] = useState(false);
  const [department, setDepartment] = useState("");
  const [doctor, setDoctor] = useState("");
  const [location, setLocation] = useState("");
  const [appointments, setAppointments] = useState<string[]>([]);
  const [apptDate, setApptDate] = useState<string>("");
  const [apptHour, setApptHour] = useState<string>("09");
  const [apptMinute, setApptMinute] = useState<string>("00");
  const [note, setNote] = useState("");

  const [historyOpen, setHistoryOpen] = useState(false);

  const [editingFollowup, setEditingFollowup] = useState<MmFollowup | null>(null);
  const [editDepartment, setEditDepartment] = useState("");
  const [editDoctor, setEditDoctor] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editAppointments, setEditAppointments] = useState<string[]>([]);
  const [editApptDate, setEditApptDate] = useState<string>("");
  const [editApptHour, setEditApptHour] = useState<string>("09");
  const [editApptMinute, setEditApptMinute] = useState<string>("00");
  const [editNote, setEditNote] = useState("");

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<string>("");

  useEffect(() => {
    mmEnsureDemoSeed();
    const sync = () => setFollowups(mmLoadState().followups);
    sync();
    window.addEventListener("mm:state", sync);
    return () => window.removeEventListener("mm:state", sync);
  }, []);

  const sorted = useMemo(() => {
    return followups
      .slice()
      .sort((a, b) => (a.appointments[0]?.atLocal || "").localeCompare(b.appointments[0]?.atLocal || ""));
  }, [followups]);

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const upcoming = useMemo(() => {
    return sorted
      .filter((f) => (f.appointments?.some((a) => a.atLocal.slice(0, 10) >= todayKey) ?? false))
      .map((f) => ({
        ...f,
        appointments: (f.appointments || []).slice().sort((a, b) => a.atLocal.localeCompare(b.atLocal))
      }));
  }, [sorted, todayKey]);

  const historyAppts = useMemo(() => {
    const appts = mmFlattenFollowupAppointments(followups);
    return appts
      .filter((a) => a.atLocal.slice(0, 10) < todayKey)
      .slice()
      .sort((a, b) => b.atLocal.localeCompare(a.atLocal));
  }, [followups, todayKey]);

  function openAdd() {
    setAdding(true);
    setDepartment("");
    setDoctor("");
    setLocation("");
    setAppointments([]);
    setApptDate("");
    setApptHour("09");
    setApptMinute("00");
    setNote("");
  }

  function openEdit(f: MmFollowup) {
    setEditingFollowup(f);
    setEditDepartment(f.department || "");
    setEditDoctor(f.doctor || "");
    setEditLocation(f.location || "");
    setEditAppointments((f.appointments || []).map((a) => a.atLocal).sort());
    setEditApptDate("");
    setEditApptHour("09");
    setEditApptMinute("00");
    setEditNote(f.note || "");
  }

  const minuteOptions = useMemo(
    () => ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"],
    []
  );
  const hourOptions = useMemo(
    () => Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0")),
    []
  );

  function addAppointment() {
    if (!apptDate.trim()) return;
    const v = `${apptDate}T${apptHour}:${apptMinute}`;
    setAppointments((prev) => Array.from(new Set([...prev, v])).sort());
    setApptDate("");
    setApptHour("09");
    setApptMinute("00");
  }

  function removeAppointment(v: string) {
    setAppointments((prev) => prev.filter((x) => x !== v));
  }

  function saveFollowup() {
    mmAddFollowup({
      department,
      doctor,
      location,
      appointments: appointments.map((a) => ({ atLocal: a })),
      note
    });
    setAdding(false);
  }

  function addEditAppointment() {
    if (!editApptDate.trim()) return;
    const v = `${editApptDate}T${editApptHour}:${editApptMinute}`;
    setEditAppointments((prev) => Array.from(new Set([...prev, v])).sort());
    setEditApptDate("");
    setEditApptHour("09");
    setEditApptMinute("00");
  }

  function removeEditAppointment(v: string) {
    setEditAppointments((prev) => prev.filter((x) => x !== v));
  }

  function saveEditFollowup() {
    if (!editingFollowup) return;
    mmUpdateFollowup(editingFollowup.id, {
      department: editDepartment,
      doctor: editDoctor,
      location: editLocation,
      appointments: editAppointments.map((a) => ({ id: "", atLocal: a })) as any,
      note: editNote
    });
    setEditingFollowup(null);
  }

  function startEditNote(f: MmFollowup) {
    setEditingNoteId(f.id);
    setNoteDraft(f.note || "");
  }

  function saveNote() {
    if (!editingNoteId) return;
    mmUpdateFollowup(editingNoteId, { note: noteDraft });
    setEditingNoteId(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="mm-h2">复诊计划</h2>
          <div className="mt-1 text-sm text-zinc-600">记录科室/医生/地点/时间，并留 note 便于下次复诊提问。</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="mm-btn-secondary" type="button" onClick={() => setHistoryOpen(true)}>
            历史记录
          </button>
          <button className="mm-btn-primary" type="button" onClick={openAdd}>
            添加复诊
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {upcoming.length === 0 ? (
          <div className="mm-card text-sm text-zinc-600">还没有复诊计划，点右上角“添加复诊”。</div>
        ) : (
          upcoming.map((f) => (
            <div key={f.id} className="mm-card">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-semibold">
                    {f.department || "未填写科室"}
                    {f.doctor ? ` · ${f.doctor}` : ""}
                  </div>
                  <div className="mt-1 text-sm text-zinc-600">
                    {f.location ? `${f.location} · ` : ""}
                    {(f.appointments || []).map((a) => formatLocal(a.atLocal)).join("，")}
                  </div>
                  {f.note ? (
                    <div className="mt-3 whitespace-pre-wrap break-words rounded-2xl border border-zinc-200/70 bg-zinc-50 p-3 text-sm text-zinc-700">
                      {f.note}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 mm-divider" />
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="mm-btn-secondary" type="button" onClick={() => openEdit(f)}>
                  编辑
                </button>
                <button className="mm-btn-secondary" type="button" onClick={() => startEditNote(f)}>
                  编辑备注
                </button>
                <button
                  className="mm-btn-secondary"
                  type="button"
                  onClick={() => {
                    const ok = window.confirm("确认删除这条复诊计划？");
                    if (!ok) return;
                    mmDeleteFollowup(f.id);
                  }}
                >
                  删除
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mm-card-compact text-sm text-zinc-600">
        小提示：复诊提醒与买药/续方提醒都会在「导出」里统一生成 `.ics` 事件。
      </div>

      {adding ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center">
          <div className="w-full max-w-xl rounded-3xl bg-white shadow-xl shadow-zinc-900/15">
            <div className="px-4 pb-2 pt-4">
              <div className="text-base font-semibold">新建复诊计划</div>
              <div className="mt-1 text-sm text-zinc-600">可添加单个或多个日期/时间。</div>
            </div>

            <div className="max-h-[72vh] space-y-4 overflow-y-auto px-4 pb-4">
              <div className="grid gap-3">
                <label className="block">
                  <div className="text-xs font-medium text-zinc-500">科室</div>
                  <input className="mt-2 mm-input" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="例如：心内科" />
                </label>
                <label className="block">
                  <div className="text-xs font-medium text-zinc-500">医生</div>
                  <input className="mt-2 mm-input" value={doctor} onChange={(e) => setDoctor(e.target.value)} placeholder="例如：王医生" />
                </label>
                <label className="block">
                  <div className="text-xs font-medium text-zinc-500">地点</div>
                  <input className="mt-2 mm-input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="例如：XX医院 2 楼 203" />
                </label>
              </div>

              <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50 p-4">
                <div className="text-sm font-semibold">日期 / 时间</div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <label className="block">
                    <div className="mb-1 text-[11px] font-medium text-zinc-500">日期</div>
                    <input
                      className="mm-input"
                      type="date"
                      value={apptDate}
                      onChange={(e) => setApptDate(e.target.value)}
                    />
                  </label>
                  <label className="block">
                    <div className="mb-1 text-[11px] font-medium text-zinc-500">时</div>
                    <select className="mm-input" value={apptHour} onChange={(e) => setApptHour(e.target.value)}>
                      {hourOptions.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <div className="mb-1 text-[11px] font-medium text-zinc-500">分</div>
                    <select className="mm-input" value={apptMinute} onChange={(e) => setApptMinute(e.target.value)}>
                      {minuteOptions.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="mt-2">
                  <button className="mm-btn-secondary shrink-0" type="button" onClick={addAppointment}>
                    添加
                  </button>
                </div>
                <div className="mt-3 flex flex-col items-start gap-2">
                  {appointments.length === 0 ? (
                    <span className="text-sm text-zinc-600">还没添加时间</span>
                  ) : (
                    appointments
                      .slice()
                      .sort()
                      .map((a) => (
                      <button
                        key={a}
                        type="button"
                        className="flex max-w-[280px] items-center justify-between gap-3 rounded-2xl border border-zinc-200/70 bg-white px-3 py-2 text-sm text-zinc-800"
                        onClick={() => removeAppointment(a)}
                        title="点击移除"
                      >
                        <span className="truncate font-medium">{formatLocal(a)}</span>
                        <span className="text-zinc-400">×</span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50 p-4">
                <div className="text-sm font-semibold">备注（下次想问什么）</div>
                <textarea className="mt-3 mm-input min-h-[96px]" value={note} onChange={(e) => setNote(e.target.value)} placeholder="例如：1) 最近头晕是否与用药有关？2) 是否需要调整剂量？" />
                <div className="mt-2 text-sm text-zinc-600">保存后可在列表里随时点“编辑备注”修改。</div>
              </div>
            </div>

            <div className="border-t border-zinc-200/70 bg-white px-4 py-3">
              <div className="flex gap-2">
                <button className="mm-btn-secondary flex-1" type="button" onClick={() => setAdding(false)}>
                  取消
                </button>
                <button className="mm-btn-primary flex-1" type="button" onClick={saveFollowup}>
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {editingFollowup ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center">
          <div className="w-full max-w-xl rounded-3xl bg-white shadow-xl shadow-zinc-900/15">
            <div className="px-4 pb-2 pt-4">
              <div className="text-base font-semibold">编辑复诊计划</div>
              <div className="mt-1 text-sm text-zinc-600">可修改科室、医生、地点、日期/时间与备注。</div>
            </div>

            <div className="max-h-[72vh] space-y-4 overflow-y-auto px-4 pb-4">
              <div className="grid gap-3">
                <label className="block">
                  <div className="text-xs font-medium text-zinc-500">科室</div>
                  <input className="mt-2 mm-input" value={editDepartment} onChange={(e) => setEditDepartment(e.target.value)} />
                </label>
                <label className="block">
                  <div className="text-xs font-medium text-zinc-500">医生</div>
                  <input className="mt-2 mm-input" value={editDoctor} onChange={(e) => setEditDoctor(e.target.value)} />
                </label>
                <label className="block">
                  <div className="text-xs font-medium text-zinc-500">地点</div>
                  <input className="mt-2 mm-input" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />
                </label>
              </div>

              <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50 p-4">
                <div className="text-sm font-semibold">日期 / 时间</div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <label className="block">
                    <div className="mb-1 text-[11px] font-medium text-zinc-500">日期</div>
                    <input className="mm-input" type="date" value={editApptDate} onChange={(e) => setEditApptDate(e.target.value)} />
                  </label>
                  <label className="block">
                    <div className="mb-1 text-[11px] font-medium text-zinc-500">时</div>
                    <select className="mm-input" value={editApptHour} onChange={(e) => setEditApptHour(e.target.value)}>
                      {hourOptions.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <div className="mb-1 text-[11px] font-medium text-zinc-500">分</div>
                    <select className="mm-input" value={editApptMinute} onChange={(e) => setEditApptMinute(e.target.value)}>
                      {minuteOptions.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="mt-2">
                  <button className="mm-btn-secondary shrink-0" type="button" onClick={addEditAppointment}>
                    添加
                  </button>
                </div>
                <div className="mt-3 flex flex-col items-start gap-2">
                  {editAppointments.length === 0 ? (
                    <span className="text-sm text-zinc-600">还没添加时间</span>
                  ) : (
                    editAppointments
                      .slice()
                      .sort()
                      .map((a) => (
                      <button
                        key={a}
                        type="button"
                        className="flex max-w-[280px] items-center justify-between gap-3 rounded-2xl border border-zinc-200/70 bg-white px-3 py-2 text-sm text-zinc-800"
                        onClick={() => removeEditAppointment(a)}
                        title="点击移除"
                      >
                        <span className="truncate font-medium">{formatLocal(a)}</span>
                        <span className="text-zinc-400">×</span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50 p-4">
                <div className="text-sm font-semibold">备注</div>
                <textarea className="mt-3 mm-input min-h-[120px]" value={editNote} onChange={(e) => setEditNote(e.target.value)} />
              </div>
            </div>

            <div className="border-t border-zinc-200/70 bg-white px-4 py-3">
              <div className="flex gap-2">
                <button className="mm-btn-secondary flex-1" type="button" onClick={() => setEditingFollowup(null)}>
                  取消
                </button>
                <button className="mm-btn-primary flex-1" type="button" onClick={saveEditFollowup}>
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {historyOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center">
          <div className="w-full max-w-xl rounded-3xl bg-white shadow-xl shadow-zinc-900/15">
            <div className="px-4 pb-2 pt-4">
              <div className="text-base font-semibold">历史复诊记录</div>
              <div className="mt-1 text-sm text-zinc-600">展示所有已过去的复诊/预约时间。</div>
            </div>
            <div className="max-h-[72vh] space-y-2 overflow-y-auto px-4 pb-4">
              {historyAppts.length === 0 ? (
                <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50 p-4 text-sm text-zinc-600">
                  暂无历史记录。
                </div>
              ) : (
                historyAppts.map((a) => (
                  <div key={a.appointmentId} className="rounded-2xl border border-zinc-200/70 bg-white p-3">
                    <div className="text-sm font-semibold text-zinc-900">
                      {formatLocal(a.atLocal)} · {[a.department, a.doctor].filter(Boolean).join(" · ") || "复诊/预约"}
                    </div>
                    <div className="mt-1 text-sm text-zinc-600">{a.location || ""}</div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-zinc-200/70 bg-white px-4 py-3">
              <button className="mm-btn-secondary w-full" type="button" onClick={() => setHistoryOpen(false)}>
                关闭
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editingNoteId ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center">
          <div className="w-full max-w-xl rounded-3xl bg-white shadow-xl shadow-zinc-900/15">
            <div className="px-4 pb-2 pt-4">
              <div className="text-base font-semibold">编辑备注</div>
              <div className="mt-1 text-sm text-zinc-600">随时更新下次复诊要问的问题。</div>
            </div>
            <div className="px-4 pb-4">
              <textarea className="mm-input min-h-[140px]" value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} />
            </div>
            <div className="border-t border-zinc-200/70 bg-white px-4 py-3">
              <div className="flex gap-2">
                <button className="mm-btn-secondary flex-1" type="button" onClick={() => setEditingNoteId(null)}>
                  取消
                </button>
                <button className="mm-btn-primary flex-1" type="button" onClick={saveNote}>
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

