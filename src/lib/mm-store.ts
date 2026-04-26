export type MmDoseStatus = "pending" | "taken" | "skipped";

export type MmMedication = {
  id: string;
  name: string;
  dosageText: string;
  amountText: string; // 默认每次用量展示（MVP）
  imageUrl?: string;
};

export type MmSupply = {
  id: string;
  medicationId: string;
  onHand: number;
  unit: string; // 片/粒/支...
  refillLeadDays: number;
  updatedAt: number;
};

export type MmPlan = {
  id: string;
  medicationId: string;
  startDate: string; // YYYY-MM-DD
  intervalDays: number; // 1=每天，2=隔天...
  times: string[]; // HH:mm
  updatedAt: number;
};

export type MmDose = {
  id: string;
  date: string; // YYYY-MM-DD (local)
  time: string; // HH:mm
  medicationName: string;
  dosageText: string; // e.g. 20mg/片
  amountText: string; // e.g. 1 片
  imageUrl?: string;
  medicationId?: string;
  status: MmDoseStatus;
  updatedAt: number;
};

export type MmActionType = "dose_patch";

export type MmAction = {
  id: string;
  type: MmActionType;
  at: number;
  doseId: string;
  prev: Pick<MmDose, "status" | "time">;
  next: Pick<MmDose, "status" | "time">;
};

export type MmState = {
  version: 1;
  medications: MmMedication[];
  supplies: MmSupply[];
  plans: MmPlan[];
  doses: MmDose[];
  actions: MmAction[];
};

const STORAGE_KEY = "mm_state_v1";

function safeParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function mmTodayKey(now = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function mmSortDoses(a: MmDose, b: MmDose) {
  if (a.date !== b.date) return a.date.localeCompare(b.date);
  if (a.time !== b.time) return a.time.localeCompare(b.time);
  return a.updatedAt - b.updatedAt;
}

export function mmLoadState(): MmState {
  if (typeof window === "undefined") {
    return { version: 1, medications: [], supplies: [], plans: [], doses: [], actions: [] };
  }
  const parsed = safeParse<MmState>(window.localStorage.getItem(STORAGE_KEY));
  if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.doses)) {
    return { version: 1, medications: [], supplies: [], plans: [], doses: [], actions: [] };
  }
  if (!Array.isArray(parsed.medications)) parsed.medications = [];
  if (!Array.isArray(parsed.supplies)) parsed.supplies = [];
  if (!Array.isArray(parsed.plans)) parsed.plans = [];
  if (!Array.isArray(parsed.actions)) parsed.actions = [];
  return parsed;
}

export function mmSaveState(state: MmState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new Event("mm:state"));
}

export function mmClearState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("mm:state"));
}

export function mmResetToDemo() {
  mmClearState();
  return mmEnsureDemoSeed();
}

function mmParseDate(date: string) {
  // YYYY-MM-DD
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date();
  dt.setFullYear(y, (m ?? 1) - 1, d ?? 1);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function mmDaysBetween(a: string, b: string) {
  const da = mmParseDate(a).getTime();
  const db = mmParseDate(b).getTime();
  return Math.round((db - da) / (24 * 60 * 60 * 1000));
}

function mmEnsureDosesForDate(state: MmState, date: string) {
  const existing = state.doses.filter((d) => d.date === date);
  if (existing.length > 0) return state;

  const medsById = new Map(state.medications.map((m) => [m.id, m]));
  const duePlans = state.plans.filter((p) => {
    const interval = Math.max(1, Math.floor(p.intervalDays));
    const diff = mmDaysBetween(p.startDate, date);
    return diff >= 0 && diff % interval === 0;
  });

  const newDoses: MmDose[] = duePlans.flatMap((p) => {
    const med = medsById.get(p.medicationId);
    if (!med) return [];
    const times = (p.times?.length ? p.times : ["08:00"]).slice().sort();
    return times.map((time) => ({
      id: mmId("dose"),
      date,
      time,
      medicationId: med.id,
      medicationName: med.name,
      dosageText: med.dosageText,
      amountText: med.amountText,
      imageUrl: med.imageUrl,
      status: "pending" as const,
      updatedAt: Date.now()
    }));
  });

  return {
    ...state,
    doses: [...state.doses, ...newDoses].sort(mmSortDoses)
  } satisfies MmState;
}

function mmRegenerateDosesForMedicationOnDate(state: MmState, medicationId: string, date: string) {
  // 仅重建当天、且仅重建该药品“待服(pending)”项，避免覆盖已服/跳过历史
  const others = state.doses.filter((d) => !(d.date === date && d.medicationId === medicationId && d.status === "pending"));

  const med = state.medications.find((m) => m.id === medicationId);
  const plan = state.plans.find((p) => p.medicationId === medicationId);
  if (!med || !plan) return { ...state, doses: others } satisfies MmState;

  const diff = mmDaysBetween(plan.startDate, date);
  const interval = Math.max(1, Math.floor(plan.intervalDays));
  const due = diff >= 0 && diff % interval === 0;
  if (!due) return { ...state, doses: others } satisfies MmState;

  const times = (plan.times?.length ? plan.times : ["08:00"]).slice().sort();
  const rebuilt: MmDose[] = times.map((time) => ({
    id: mmId("dose"),
    date,
    time,
    medicationId: med.id,
    medicationName: med.name,
    dosageText: med.dosageText,
    amountText: med.amountText,
    imageUrl: med.imageUrl,
    status: "pending",
    updatedAt: Date.now()
  }));

  return {
    ...state,
    doses: [...others, ...rebuilt].sort(mmSortDoses)
  } satisfies MmState;
}

function mmUpdateDoseDisplayForMedication(state: MmState, medicationId: string, date: string) {
  const med = state.medications.find((m) => m.id === medicationId);
  if (!med) return state;
  const next = {
    ...state,
    doses: state.doses.map((d) => {
      if (d.medicationId !== medicationId) return d;
      // 仅更新“展示字段”，不碰 status/time，且只更新当天，避免改历史
      if (d.date !== date) return d;
      return {
        ...d,
        medicationName: med.name,
        dosageText: med.dosageText,
        amountText: med.amountText,
        imageUrl: med.imageUrl
      };
    })
  } satisfies MmState;
  return next;
}

export function mmEnsureDemoSeed(now = new Date()) {
  const state = mmLoadState();
  if (state.medications.length > 0 || state.plans.length > 0 || state.doses.length > 0) {
    // 确保至少今天有 dose（新的一天打开也会生成）
    const today = mmTodayKey(now);
    const ensured = mmEnsureDosesForDate(state, today);
    if (ensured !== state) mmSaveState(ensured);
    return ensured;
  }

  const today = mmTodayKey(now);
  const seeded: MmState = {
    version: 1,
    actions: [],
    medications: [
      { id: "med-1", name: "二甲双胍", dosageText: "500mg/粒", amountText: "2 粒", imageUrl: "/demo/med-1.png" },
      { id: "med-2", name: "氨氯地平片", dosageText: "5mg", amountText: "1 片", imageUrl: "/demo/med-2.png" },
      { id: "med-3", name: "阿托伐他汀", dosageText: "20mg/片", amountText: "1 片", imageUrl: "/demo/med-3.png" }
    ],
    supplies: [
      { id: "sup-1", medicationId: "med-1", onHand: 45, unit: "粒", refillLeadDays: 5, updatedAt: Date.now() },
      { id: "sup-2", medicationId: "med-2", onHand: 15, unit: "片", refillLeadDays: 5, updatedAt: Date.now() + 1 },
      { id: "sup-3", medicationId: "med-3", onHand: 18, unit: "片", refillLeadDays: 5, updatedAt: Date.now() + 2 }
    ],
    plans: [
      { id: "plan-1", medicationId: "med-1", startDate: today, intervalDays: 1, times: ["08:00"], updatedAt: Date.now() },
      { id: "plan-2", medicationId: "med-2", startDate: today, intervalDays: 1, times: ["12:00"], updatedAt: Date.now() + 1 },
      { id: "plan-3", medicationId: "med-3", startDate: today, intervalDays: 1, times: ["20:00"], updatedAt: Date.now() + 2 }
    ],
    doses: []
  };

  const withDoses = mmEnsureDosesForDate(seeded, today);
  mmSaveState(withDoses);
  return withDoses;
}

function mmId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 8)}`;
}

function mmApplyDosePatch(state: MmState, id: string, patch: Partial<MmDose>) {
  return {
    ...state,
    doses: state.doses.map((d) => (d.id === id ? { ...d, ...patch, updatedAt: Date.now() } : d))
  } satisfies MmState;
}

export function mmUpdateDose(id: string, patch: Partial<MmDose>) {
  const state = mmLoadState();
  const current = state.doses.find((d) => d.id === id);
  if (!current) return state;

  const prev = { status: current.status, time: current.time } as const;
  const nextVals = {
    status: (patch.status ?? current.status) as MmDoseStatus,
    time: (patch.time ?? current.time) as string
  } as const;

  const withPatch = mmApplyDosePatch(state, id, patch);
  const action: MmAction = {
    id: mmId("act"),
    type: "dose_patch",
    at: Date.now(),
    doseId: id,
    prev,
    next: nextVals
  };

  const withAction = {
    ...withPatch,
    actions: [...(withPatch.actions ?? []), action].slice(-50)
  } satisfies MmState;

  mmSaveState(withAction);
  return withAction;
}

export function mmUpsertPlanForMedication(medicationId: string, patch: Pick<MmPlan, "intervalDays" | "times">, date = mmTodayKey(new Date())) {
  const state = mmLoadState();
  const existing = state.plans.find((p) => p.medicationId === medicationId);
  const nextPlans = existing
    ? state.plans.map((p) =>
        p.medicationId === medicationId
          ? { ...p, ...patch, updatedAt: Date.now() }
          : p
      )
    : [
        ...state.plans,
        {
          id: mmId("plan"),
          medicationId,
          startDate: date,
          intervalDays: patch.intervalDays,
          times: patch.times,
          updatedAt: Date.now()
        }
      ];

  const regenerated = mmRegenerateDosesForMedicationOnDate(
    { ...state, plans: nextPlans } satisfies MmState,
    medicationId,
    date
  );
  mmSaveState(regenerated);
  return regenerated;
}

export function mmAddMedication(input: {
  name: string;
  dosageText: string;
  amountText: string;
  imageUrl?: string;
  intervalDays: number;
  times: string[];
  supplyOnHand: number;
  supplyUnit: string;
  refillLeadDays: number;
}) {
  const state = mmLoadState();
  const today = mmTodayKey(new Date());

  const medId = mmId("med");
  const med: MmMedication = {
    id: medId,
    name: input.name.trim(),
    dosageText: input.dosageText.trim(),
    amountText: input.amountText.trim(),
    imageUrl: input.imageUrl
  };

  const plan: MmPlan = {
    id: mmId("plan"),
    medicationId: medId,
    startDate: today,
    intervalDays: Math.max(1, Math.floor(input.intervalDays || 1)),
    times: (input.times?.length ? input.times : ["08:00"]).slice().sort(),
    updatedAt: Date.now()
  };

  const supply: MmSupply = {
    id: mmId("sup"),
    medicationId: medId,
    onHand: Number.isFinite(input.supplyOnHand) ? Math.max(0, Math.floor(input.supplyOnHand)) : 0,
    unit: input.supplyUnit.trim() || "片",
    refillLeadDays: Number.isFinite(input.refillLeadDays) ? Math.max(0, Math.floor(input.refillLeadDays)) : 5,
    updatedAt: Date.now()
  };

  const next: MmState = {
    ...state,
    medications: [...state.medications, med],
    plans: [...state.plans, plan],
    supplies: [...state.supplies, supply]
  };

  const withDoses = mmEnsureDosesForDate(next, today);
  mmSaveState(withDoses);
  return withDoses;
}

export function mmUpdateMedication(medicationId: string, patch: Partial<Pick<MmMedication, "name" | "dosageText" | "amountText" | "imageUrl">>) {
  const state = mmLoadState();
  const existing = state.medications.find((m) => m.id === medicationId);
  if (!existing) return state;

  const nextMeds = state.medications.map((m) =>
    m.id === medicationId
      ? {
          ...m,
          name: (patch.name ?? m.name).trim(),
          dosageText: (patch.dosageText ?? m.dosageText).trim(),
          amountText: (patch.amountText ?? m.amountText).trim(),
          imageUrl: patch.imageUrl ?? m.imageUrl
        }
      : m
  );

  const today = mmTodayKey(new Date());
  const next = mmUpdateDoseDisplayForMedication(
    { ...state, medications: nextMeds } satisfies MmState,
    medicationId,
    today
  );
  mmSaveState(next);
  return next;
}

export function mmUpdateSupply(medicationId: string, patch: Partial<Pick<MmSupply, "onHand" | "unit" | "refillLeadDays">>) {
  const state = mmLoadState();
  const existing = state.supplies.find((s) => s.medicationId === medicationId);
  const nextSupplies = existing
    ? state.supplies.map((s) =>
        s.medicationId === medicationId
          ? {
              ...s,
              onHand: patch.onHand ?? s.onHand,
              unit: (patch.unit ?? s.unit).trim() || s.unit,
              refillLeadDays: patch.refillLeadDays ?? s.refillLeadDays,
              updatedAt: Date.now()
            }
          : s
      )
    : [
        ...state.supplies,
        {
          id: mmId("sup"),
          medicationId,
          onHand: patch.onHand ?? 0,
          unit: (patch.unit ?? "片").trim() || "片",
          refillLeadDays: patch.refillLeadDays ?? 5,
          updatedAt: Date.now()
        }
      ];

  const next = { ...state, supplies: nextSupplies } satisfies MmState;
  mmSaveState(next);
  return next;
}

export function mmAdjustSupply(medicationId: string, delta: number) {
  const state = mmLoadState();
  const existing = state.supplies.find((s) => s.medicationId === medicationId);
  const current = existing?.onHand ?? 0;
  const nextOnHand = Math.max(0, Math.floor(current + delta));
  return mmUpdateSupply(medicationId, { onHand: nextOnHand });
}

export function mmCanUndo() {
  const state = mmLoadState();
  return (state.actions?.length ?? 0) > 0;
}

export function mmUndoLastAction() {
  const state = mmLoadState();
  const actions = state.actions ?? [];
  const last = actions[actions.length - 1];
  if (!last) return state;

  if (last.type === "dose_patch") {
    const reverted = mmApplyDosePatch(state, last.doseId, {
      status: last.prev.status,
      time: last.prev.time
    });
    const nextState = {
      ...reverted,
      actions: actions.slice(0, -1)
    } satisfies MmState;
    mmSaveState(nextState);
    return nextState;
  }

  return state;
}

