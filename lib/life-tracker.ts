export type HabitType = "positive" | "negative";

export type Habit = {
  id: string;
  name: string;
  type: HabitType;
  streakEnabled: boolean;
  penaltyMultiplier?: number;
};

export type DayData = {
  checked: Record<string, boolean>;
};

export type AppStorage = {
  habits: Habit[];
  entries: Record<string, DayData>;
};

export const STORAGE_KEY = "life-tracker-v1";

export function defaultHabits(): Habit[] {
  return [
    { id: "wake-early", name: "Wake Early", type: "positive", streakEnabled: true },
    { id: "workout", name: "Workout", type: "positive", streakEnabled: true },
    { id: "deep-work", name: "Deep Work", type: "positive", streakEnabled: true },
    { id: "urges-resisted", name: "Urges Resisted", type: "positive", streakEnabled: true },
    { id: "learning", name: "Learning", type: "positive", streakEnabled: false },
    { id: "phone-less-1h", name: "Phone < 1h", type: "positive", streakEnabled: false },
    {
      id: "early-watching",
      name: "Early Watching",
      type: "negative",
      streakEnabled: true,
      penaltyMultiplier: 1,
    },
    {
      id: "full-relapse",
      name: "Full Relapse",
      type: "negative",
      streakEnabled: true,
      penaltyMultiplier: 2,
    },
    { id: "netflix", name: "Netflix", type: "negative", streakEnabled: false },
    { id: "social-media", name: "Social Media", type: "negative", streakEnabled: false },
    { id: "sugar", name: "Sugar", type: "negative", streakEnabled: false },
  ];
}

function isLegacyFlatEntries(raw: unknown): raw is Record<string, DayData> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;
  const o = raw as Record<string, unknown>;
  if ("habits" in o || "entries" in o) return false;
  const keys = Object.keys(o);
  if (keys.length === 0) return true;
  return keys.every((k) => /^\d{4}-\d{2}-\d{2}$/.test(k));
}

export function loadInitialStorage(): AppStorage {
  if (typeof window === "undefined") return { habits: defaultHabits(), entries: {} };

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return { habits: defaultHabits(), entries: {} };

  try {
    const parsed = JSON.parse(saved) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed) &&
      "habits" in parsed &&
      "entries" in parsed
    ) {
      const p = parsed as AppStorage & { habits?: Habit[] };
      const rawHabits = Array.isArray(p.habits) ? p.habits : defaultHabits();
      // Back-compat: if older versions used `archived`, drop those habits.
      const habits = rawHabits.filter(
        (h) => h && typeof h === "object" && !(h as { archived?: boolean }).archived
      );
      return {
        habits: habits.length > 0 ? habits : defaultHabits(),
        entries: p.entries && typeof p.entries === "object" ? p.entries : {},
      };
    }
    if (isLegacyFlatEntries(parsed)) {
      return { habits: defaultHabits(), entries: parsed };
    }
  } catch {
    /* ignore */
  }

  return { habits: defaultHabits(), entries: {} };
}

export function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

export function addDaysUtc(dateKey: string, deltaDays: number) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + deltaDays);
  return date.toISOString().split("T")[0];
}

export function isValidDateKey(value: string | null | undefined): value is string {
  if (!value) return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

