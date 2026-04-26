export type MmDoseStatus = "pending" | "taken" | "skipped";

export type MmDose = {
  id: string;
  date: string; // YYYY-MM-DD (local)
  time: string; // HH:mm
  medicationName: string;
  dosageText: string; // e.g. 20mg/片
  amountText: string; // e.g. 1 片
  imageUrl?: string;
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
  if (typeof window === "undefined") return { version: 1, doses: [], actions: [] };
  const parsed = safeParse<MmState>(window.localStorage.getItem(STORAGE_KEY));
  if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.doses)) return { version: 1, doses: [], actions: [] };
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

export function mmEnsureDemoSeed(now = new Date()) {
  const state = mmLoadState();
  if (state.doses.length > 0) return state;

  const today = mmTodayKey(now);
  const seeded: MmState = {
    version: 1,
    actions: [],
    doses: [
      {
        id: "dose-1",
        date: today,
        time: "08:00",
        medicationName: "二甲双胍",
        dosageText: "500mg/粒",
        amountText: "2 粒",
        imageUrl: "/demo/med-1.png",
        status: "pending",
        updatedAt: Date.now()
      },
      {
        id: "dose-2",
        date: today,
        time: "12:00",
        medicationName: "氨氯地平片",
        dosageText: "5mg",
        amountText: "1 片",
        imageUrl: "/demo/med-2.png",
        status: "pending",
        updatedAt: Date.now() + 1
      },
      {
        id: "dose-3",
        date: today,
        time: "20:00",
        medicationName: "阿托伐他汀",
        dosageText: "20mg/片",
        amountText: "1 片",
        imageUrl: "/demo/med-3.png",
        status: "pending",
        updatedAt: Date.now() + 2
      }
    ]
  };

  mmSaveState(seeded);
  return seeded;
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

