"use client";

import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

type HabitType = "positive" | "negative";

type Habit = {
  id: string;
  name: string;
  type: HabitType;
  streakEnabled: boolean;
  penaltyMultiplier?: number;
};

type DayData = {
  checked: Record<string, boolean>;
};

type AppStorage = {
  habits: Habit[];
  entries: Record<string, DayData>;
};

const STORAGE_KEY = "life-tracker-v1";

function defaultHabits(): Habit[] {
  return [
    {
      id: "wake-early",
      name: "Wake Early",
      type: "positive",
      streakEnabled: true,
    },
    {
      id: "workout",
      name: "Workout",
      type: "positive",
      streakEnabled: true,
    },
    {
      id: "deep-work",
      name: "Deep Work",
      type: "positive",
      streakEnabled: true,
    },
    {
      id: "urges-resisted",
      name: "Urges Resisted",
      type: "positive",
      streakEnabled: true,
    },
    {
      id: "learning",
      name: "Learning",
      type: "positive",
      streakEnabled: false,
    },
    {
      id: "phone-less-1h",
      name: "Phone < 1h",
      type: "positive",
      streakEnabled: false,
    },
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
    {
      id: "netflix",
      name: "Netflix",
      type: "negative",
      streakEnabled: false,
    },
    {
      id: "social-media",
      name: "Social Media",
      type: "negative",
      streakEnabled: false,
    },
    {
      id: "sugar",
      name: "Sugar",
      type: "negative",
      streakEnabled: false,
    },
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

function loadInitialStorage(): AppStorage {
  if (typeof window === "undefined") {
    return { habits: defaultHabits(), entries: {} };
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return { habits: defaultHabits(), entries: {} };
  }

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
      const habits = rawHabits.filter(
        (h) => h && typeof h === "object" && !(h as { archived?: boolean }).archived
      );
      return {
        habits: habits.length > 0 ? habits : defaultHabits(),
        entries:
          p.entries && typeof p.entries === "object" ? p.entries : {},
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

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function addDaysUtc(dateKey: string, deltaDays: number) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + deltaDays);
  return date.toISOString().split("T")[0];
}

export default function Page() {
  const [store, setStore] = useState<AppStorage>(() => loadInitialStorage());
  const [addHabitOpen, setAddHabitOpen] = useState(false);
  const [manageHabitsOpen, setManageHabitsOpen] = useState(false);

  const todayKey = getTodayKey();
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);
  const isAtToday = selectedDate === todayKey;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store]);

  const { habits, entries } = store;

  function getHabitChecked(dateKey: string, habitId: string) {
    return !!entries[dateKey]?.checked?.[habitId];
  }

  function getHabitStreak(habitId: string, dateKey: string) {
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const key = addDaysUtc(dateKey, -i);
      if (getHabitChecked(key, habitId)) streak++;
      else break;
    }
    return streak;
  }

  function getHabitScore(habit: Habit, dateKey: string, streak: number) {
    const isChecked = getHabitChecked(dateKey, habit.id);
    if (!isChecked) return 0;

    if (habit.type === "positive") {
      if (!habit.streakEnabled) return 1;
      return Math.min(streak, 3);
    }

    if (!habit.streakEnabled) return -1;
    return -(Math.min(streak, 3) * (habit.penaltyMultiplier || 1));
  }

  function getDayScoreForHabits(dateKey: string, habitList: Habit[]) {
    const raw = habitList.reduce((sum, habit) => {
      const streak = habit.streakEnabled
        ? getHabitStreak(habit.id, dateKey)
        : 0;
      return sum + getHabitScore(habit, dateKey, streak);
    }, 0);
    return Math.max(raw, -7);
  }

  function toggleHabit(habitId: string, checked: boolean) {
    setStore((prev) => ({
      ...prev,
      entries: {
        ...prev.entries,
        [selectedDate]: {
          checked: {
            ...(prev.entries[selectedDate]?.checked || {}),
            [habitId]: checked,
          },
        },
      },
    }));
  }

  function removeHabitFromEntries(
    prevEntries: Record<string, DayData>,
    habitId: string
  ) {
    const next: Record<string, DayData> = {};
    for (const [dateKey, day] of Object.entries(prevEntries)) {
      const checked = { ...day.checked };
      delete checked[habitId];
      if (Object.keys(checked).length > 0) {
        next[dateKey] = { checked };
      }
    }
    return next;
  }

  function deleteHabit(id: string) {
    setStore((prev) => ({
      habits: prev.habits.filter((h) => h.id !== id),
      entries: removeHabitFromEntries(prev.entries, id),
    }));
  }

  function addHabit(payload: {
    name: string;
    type: HabitType;
    streakEnabled: boolean;
  }) {
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `habit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    const base: Habit = {
      id,
      name: payload.name.trim(),
      type: payload.type,
      streakEnabled: payload.streakEnabled,
    };

    if (payload.type === "negative" && payload.streakEnabled) {
      base.penaltyMultiplier = 1;
    }

    setStore((prev) => ({
      ...prev,
      habits: [...prev.habits, base],
    }));
  }

  const dayScore = getDayScoreForHabits(selectedDate, habits);
  const totalScoreAllTime = Object.keys(entries).reduce((sum, dateKey) => {
    return sum + getDayScoreForHabits(dateKey, habits);
  }, 0);

  const positives = habits.filter((h) => h.type === "positive");
  const negatives = habits.filter((h) => h.type === "negative");

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 px-4 py-5 pb-32">
      <div className="max-w-sm mx-auto space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSelectedDate((d) => addDaysUtc(d, -1))}
              className="h-9 w-9 flex items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 active:bg-zinc-50"
              aria-label="Previous day"
            >
              ‹
            </button>

            <div className="text-center leading-tight">
              <p className="text-xs text-zinc-500">
                {new Date(`${selectedDate}T00:00:00.000Z`).toLocaleDateString(
                  undefined,
                  { month: "long", day: "numeric", year: "numeric" }
                )}
              </p>
              <h1 className="text-2xl font-bold tracking-tight">
                {isAtToday
                  ? "Today"
                  : new Date(`${selectedDate}T00:00:00.000Z`).toLocaleDateString(
                      undefined,
                      { weekday: "long" }
                    )}
              </h1>
            </div>

            <button
              type="button"
              onClick={() => setSelectedDate((d) => addDaysUtc(d, 1))}
              disabled={isAtToday}
              className="h-9 w-9 flex items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 disabled:opacity-40 disabled:pointer-events-none active:bg-zinc-50"
              aria-label="Next day"
            >
              ›
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-white border border-zinc-200 rounded-2xl px-4 py-2 shadow-sm min-h-[92px] relative">
            <p className="text-[11px] font-semibold tracking-wide text-zinc-500 uppercase">
              Today&apos;s Score
            </p>

            <div className="absolute inset-x-0 bottom-2 top-7 flex items-center justify-center">
              <h2
                className={`text-4xl leading-none font-bold ${
                  dayScore >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {dayScore > 0 ? "+" : ""}
                {dayScore}
              </h2>
            </div>
          </Card>

          <Card className="bg-white border border-zinc-200 rounded-2xl px-4 py-2.5 shadow-sm min-h-[92px] flex flex-col justify-between">
            <p className="text-[11px] font-semibold tracking-wide text-zinc-500 uppercase">
              Total Score
            </p>

            <h2 className="text-4xl leading-none font-bold text-zinc-900">
              {totalScoreAllTime}
            </h2>

            <p className="text-xs text-zinc-500">All time</p>
          </Card>
        </div>

        <section className="space-y-2">
          <h3 className="text-sm font-extrabold tracking-widest text-green-500 uppercase">
            Positive Habits
          </h3>

          <Card className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
            {positives.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-zinc-500">
                No positive habits yet. Add one below.
              </p>
            ) : (
              <div className="divide-y divide-zinc-100">
                {positives.map((habit) => {
                  const streak = habit.streakEnabled
                    ? getHabitStreak(habit.id, selectedDate)
                    : 0;
                  const score = getHabitScore(habit, selectedDate, streak);

                  return (
                    <HabitRow
                      key={habit.id}
                      name={habit.name}
                      checked={getHabitChecked(selectedDate, habit.id)}
                      onCheckedChange={(value) =>
                        toggleHabit(habit.id, value === true)
                      }
                      streak={habit.streakEnabled ? streak : null}
                      score={score}
                      variant="positive"
                    />
                  );
                })}
              </div>
            )}
          </Card>
        </section>

        <Separator className="bg-zinc-200" />

        <section className="space-y-2">
          <h3 className="text-sm font-extrabold tracking-widest text-red-500 uppercase">
            Negative Habits
          </h3>

          <Card className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
            {negatives.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-zinc-500">
                No negative habits yet. Add one below.
              </p>
            ) : (
              <div className="divide-y divide-zinc-100">
                {negatives.map((habit) => {
                  const streak = habit.streakEnabled
                    ? getHabitStreak(habit.id, selectedDate)
                    : 0;
                  const score = getHabitScore(habit, selectedDate, streak);

                  return (
                    <HabitRow
                      key={habit.id}
                      name={habit.name}
                      checked={getHabitChecked(selectedDate, habit.id)}
                      onCheckedChange={(value) =>
                        toggleHabit(habit.id, value === true)
                      }
                      streak={habit.streakEnabled ? streak : null}
                      score={score}
                      variant="negative"
                    />
                  );
                })}
              </div>
            )}
          </Card>
        </section>

        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-zinc-50/95 px-4 py-3 backdrop-blur-sm">
          <div className="max-w-sm mx-auto grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-auto min-h-11 flex-col gap-0.5 rounded-xl border-zinc-200 bg-white py-2.5 text-zinc-900 shadow-sm"
              onClick={() => setAddHabitOpen(true)}
            >
              <span className="text-sm font-medium">Add habit</span>
              <span className="text-[10px] font-normal text-zinc-500">
                New direction or slip
              </span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-auto min-h-11 flex-col gap-0.5 rounded-xl border-zinc-200 bg-white py-2.5 text-zinc-900 shadow-sm"
              onClick={() => setManageHabitsOpen(true)}
            >
              <span className="text-sm font-medium">Manage</span>
              <span className="text-[10px] font-normal text-zinc-500">
                List & delete
              </span>
            </Button>
          </div>
        </div>
      </div>

      <AddHabitDialog
        open={addHabitOpen}
        onOpenChange={setAddHabitOpen}
        onCreate={addHabit}
      />

      <ManageHabitsDialog
        open={manageHabitsOpen}
        onOpenChange={setManageHabitsOpen}
        habits={habits}
        onDelete={deleteHabit}
      />
    </main>
  );
}

type AddHabitDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (payload: {
    name: string;
    type: HabitType;
    streakEnabled: boolean;
  }) => void;
};

function AddHabitDialog({
  open,
  onOpenChange,
  onCreate,
}: AddHabitDialogProps) {
  const [name, setName] = useState("");
  const [newType, setNewType] = useState<HabitType>("positive");
  const [streakEnabled, setStreakEnabled] = useState(true);

  function resetForm() {
    setName("");
    setNewType("positive");
    setStreakEnabled(true);
  }

  function handleDialogOpenChange(next: boolean) {
    if (!next) resetForm();
    onOpenChange(next);
  }

  function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate({
      name: trimmed,
      type: newType,
      streakEnabled,
    });
    handleDialogOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0">
        <div className="border-b border-zinc-100 px-5 pb-4 pt-5">
          <DialogTitle className="text-xl">Add habit</DialogTitle>
          <DialogDescription className="mt-2 text-sm leading-relaxed text-zinc-600">
            Choose a short name and whether this habit represents direction you
            want to grow (positive) or a slip you want to notice (negative).
          </DialogDescription>
        </div>

        <div className="space-y-4 px-5 py-5">
          <label className="block space-y-1">
            <span className="text-xs font-medium text-zinc-600">Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Morning walk"
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-zinc-300"
            />
          </label>

          <div>
            <span className="mb-1.5 block text-xs font-medium text-zinc-600">
              Type
            </span>
            <div className="flex rounded-xl border border-zinc-200 bg-zinc-50 p-0.5">
              <button
                type="button"
                onClick={() => setNewType("positive")}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                  newType === "positive"
                    ? "bg-white text-green-700 shadow-sm ring-1 ring-green-200"
                    : "text-zinc-500"
                }`}
              >
                Positive
              </button>
              <button
                type="button"
                onClick={() => setNewType("negative")}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                  newType === "negative"
                    ? "bg-white text-red-700 shadow-sm ring-1 ring-red-200"
                    : "text-zinc-500"
                }`}
              >
                Negative
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
            <label className="flex items-start justify-between gap-3">
              <span className="text-sm font-medium text-zinc-800">
                Use streak for scoring
              </span>
              <input
                type="checkbox"
                checked={streakEnabled}
                onChange={(e) => setStreakEnabled(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300"
              />
            </label>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">
              <span className="font-medium text-zinc-600">Streak</span> is how
              many days in a row this habit was checked (looking back from each
              date). When this is on, points follow that count (capped at 3).
              When off, a check is always a flat +1 or −1 — no buildup.
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="flex-1">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="button"
              className="flex-1 bg-zinc-900 text-white hover:bg-zinc-800"
              onClick={handleCreate}
              disabled={!name.trim()}
            >
              Add
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type ManageHabitsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habits: Habit[];
  onDelete: (id: string) => void;
};

function ManageHabitsDialog({
  open,
  onOpenChange,
  habits,
  onDelete,
}: ManageHabitsDialogProps) {
  const [pendingDelete, setPendingDelete] = useState<Habit | null>(null);

  const positiveList = habits.filter((h) => h.type === "positive");
  const negativeList = habits.filter((h) => h.type === "negative");

  function confirmDelete() {
    if (pendingDelete) {
      onDelete(pendingDelete.id);
      setPendingDelete(null);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85vh] overflow-y-auto gap-0 p-0">
          <div className="border-b border-zinc-100 px-5 pb-4 pt-5">
            <DialogTitle className="text-xl">Manage habits</DialogTitle>
            <DialogDescription className="mt-2 text-sm leading-relaxed text-zinc-600">
              Review what you track below:{" "}
              <span className="font-medium text-green-700">Positive</span> builds
              direction,{" "}
              <span className="font-medium text-red-700">Negative</span> marks
              slips. Tap{" "}
              <span className="font-medium text-zinc-800">Delete</span> to remove
              a habit (you will confirm). Use{" "}
              <span className="font-medium text-zinc-800">Add habit</span> to
              create new ones.
            </DialogDescription>
          </div>

          <div className="max-h-[min(58vh,420px)] space-y-4 overflow-y-auto px-5 py-4">
            <section className="overflow-hidden rounded-2xl border border-green-200 bg-green-50/40">
              <div className="border-b border-green-100 bg-green-100/70 px-3 py-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-green-800">
                  Positive — direction
                </p>
              </div>
              <div className="divide-y divide-green-100">
                {positiveList.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-green-800/70">
                    No positive habits yet. Use{" "}
                    <span className="font-medium">Add habit</span>.
                  </p>
                ) : (
                  positiveList.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-start gap-3 bg-white/80 px-3 py-3 pl-2"
                    >
                      <span
                        className="mt-0.5 inline-flex shrink-0 rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                        title="Positive habit"
                      >
                        +
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold leading-snug text-zinc-900">
                          {h.name}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {h.streakEnabled
                            ? "Streak affects score (up to 3)"
                            : "Flat +1 when checked"}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => setPendingDelete(h)}
                      >
                        Delete
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-red-200 bg-red-50/40">
              <div className="border-b border-red-100 bg-red-100/70 px-3 py-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-red-900">
                  Negative — slips
                </p>
              </div>
              <div className="divide-y divide-red-100">
                {negativeList.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-red-900/70">
                    No negative habits yet. Use{" "}
                    <span className="font-medium">Add habit</span>.
                  </p>
                ) : (
                  negativeList.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-start gap-3 bg-white/80 px-3 py-3 pl-2"
                    >
                      <span
                        className="mt-0.5 inline-flex shrink-0 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
                        title="Negative habit"
                      >
                        −
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold leading-snug text-zinc-900">
                          {h.name}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {h.streakEnabled
                            ? `Streak penalty (×${h.penaltyMultiplier ?? 1}, capped at 3)`
                            : "Flat −1 when checked"}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => setPendingDelete(h)}
                      >
                        Delete
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          <div className="border-t border-zinc-100 px-5 py-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="w-full">
                Done
              </Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogTitle>Delete this habit?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">
              Are you sure you want to delete{" "}
              <span className="font-medium text-zinc-800">
                &ldquo;{pendingDelete?.name}&rdquo;
              </span>
              ?
            </span>
            <span className="block text-zinc-600">
              It will disappear from your list and all past check-ins for this
              habit will be removed. This cannot be undone.
            </span>
          </AlertDialogDescription>
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel className="mt-0 w-full sm:w-auto">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="w-full sm:w-auto"
              onClick={confirmDelete}
            >
              Delete habit
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

type HabitRowProps = {
  name: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  streak: number | null;
  score: number;
  variant?: "positive" | "negative";
};

function HabitRow({
  name,
  checked,
  onCheckedChange,
  streak,
  score,
  variant,
}: HabitRowProps) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Checkbox
            checked={checked}
            onCheckedChange={onCheckedChange}
            className={`h-5 w-5 rounded-full border-zinc-300 ${
              variant === "positive"
                ? "data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                : "data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
            }`}
          />

          <p className="font-semibold text-base truncate text-zinc-900">
            {name}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {streak !== null && (
            <span className="text-sm text-zinc-500 font-semibold tabular-nums">
              🔥 {Math.min(streak, 3)}
            </span>
          )}

          <span
            className={`text-sm font-semibold tabular-nums ${
              score > 0
                ? "text-green-500"
                : score < 0
                  ? "text-red-500"
                  : "text-zinc-400"
            }`}
          >
            {score > 0 ? "+" : ""}
            {score}
          </span>
        </div>
      </div>
    </div>
  );
}
