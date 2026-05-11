"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
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

import type { AppStorage, Habit, HabitType } from "@/lib/life-tracker";
import {
  STORAGE_KEY,
  addDaysUtc,
  getTodayKey,
  isValidDateKey,
  loadInitialStorage,
} from "@/lib/life-tracker";
import {
  negativeRecoveryHeadline,
  positiveMomentumHeadline,
} from "@/lib/streak-language";
import {
  getHabitChecked,
  getHabitScore,
  getHabitStreak,
  getRecoveryStreak,
  getScoreForDate,
  removeHabitFromEntries,
} from "@/lib/scoring";
import { trackEvent } from "@/lib/analytics";

export default function HomeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [store, setStore] = useState<AppStorage>(() => loadInitialStorage());
  const [addHabitOpen, setAddHabitOpen] = useState(false);
  const [manageHabitsOpen, setManageHabitsOpen] = useState(false);

  const todayKey = getTodayKey();
  const dParam = searchParams.get("d");
  const selectedDate = isValidDateKey(dParam) ? dParam : todayKey;
  const isAtToday = selectedDate === todayKey;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store]);

  const { habits, entries } = store;

  function toggleHabit(habitId: string, checked: boolean) {
    setStore((prev) => {
      const habitMeta = prev.habits.find((h) => h.id === habitId);
      const next: AppStorage = {
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
      };

      if (habitMeta) {
        const dayScore = getScoreForDate(next, selectedDate);
        trackEvent(
          checked ? "habit_checked" : "habit_unchecked",
          {
            habitId,
            habitType: habitMeta.type,
            selectedDate,
            day_score: dayScore,
          },
          {
            insertId: `${checked ? "c" : "uc"}-${habitId}-${selectedDate}`,
          }
        );
      }

      return next;
    });
  }

  function deleteHabit(id: string) {
    const habit = habits.find((h) => h.id === id);
    const totalHabitsAfter = habits.length - 1;

    setStore((prev) => ({
      habits: prev.habits.filter((h) => h.id !== id),
      entries: removeHabitFromEntries(prev.entries, id),
    }));

    if (habit) {
      trackEvent(
        "habit_deleted",
        {
          habitId: id,
          habitType: habit.type,
          total_habits: totalHabitsAfter,
        },
        { insertId: `deleted-${id}` }
      );
    }
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

    trackEvent(
      "habit_created",
      {
        habitId: id,
        habitType: payload.type,
        rhythm_scoring: payload.streakEnabled,
        total_habits: habits.length + 1,
      },
      { insertId: `created-${id}` }
    );
  }

  const dayScore = getScoreForDate(store, selectedDate);
  const totalScoreAllTime = Object.keys(entries).reduce((sum, dateKey) => {
    return sum + getScoreForDate(store, dateKey);
  }, 0);

  const positives = habits.filter((h) => h.type === "positive");
  const negatives = habits.filter((h) => h.type === "negative");

  function setDate(next: string) {
    if (next !== selectedDate) {
      trackEvent("date_changed", {
        from_date: selectedDate,
        to_date: next,
        viewing_today: next === todayKey,
      });
    }

    if (next === todayKey) {
      router.replace("/");
    } else {
      router.replace(`/?d=${next}`);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 px-4 py-5 pb-32">
      <div className="max-w-sm mx-auto space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setDate(addDaysUtc(selectedDate, -1))}
                className="h-9 w-9 flex items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 active:bg-zinc-50"
                aria-label="Previous day"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => setDate(addDaysUtc(selectedDate, 1))}
                disabled={isAtToday}
                className="h-9 w-9 flex items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 disabled:opacity-40 disabled:pointer-events-none active:bg-zinc-50"
                aria-label="Next day"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

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
              onClick={() => router.push(`/calendar?d=${selectedDate}`)}
              className="h-9 w-9 flex items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 active:bg-zinc-50"
              aria-label="Open calendar"
              title="Calendar"
            >
              <Calendar className="h-4 w-4" aria-hidden="true" />
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
          <h3 className="text-sm font-extrabold tracking-widest text-emerald-900/80 uppercase">
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
                  const momentumDays = habit.streakEnabled
                    ? getHabitStreak(store.entries, habit.id, selectedDate)
                    : 0;
                  const score = getHabitScore(
                    store.entries,
                    habit,
                    selectedDate,
                    momentumDays
                  );

                  return (
                    <HabitRow
                      key={habit.id}
                      name={habit.name}
                      checked={getHabitChecked(
                        store.entries,
                        selectedDate,
                        habit.id
                      )}
                      onCheckedChange={(value) =>
                        toggleHabit(habit.id, value === true)
                      }
                      trackDays={habit.streakEnabled ? momentumDays : null}
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
          <h3 className="text-sm font-extrabold tracking-widest text-amber-900/80 uppercase">
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
                  const slipStreak = habit.streakEnabled
                    ? getHabitStreak(store.entries, habit.id, selectedDate)
                    : 0;
                  const score = getHabitScore(
                    store.entries,
                    habit,
                    selectedDate,
                    slipStreak
                  );
                  const recoveryDays = getRecoveryStreak(
                    store.entries,
                    habit.id,
                    selectedDate
                  );

                  return (
                    <HabitRow
                      key={habit.id}
                      name={habit.name}
                      checked={getHabitChecked(
                        store.entries,
                        selectedDate,
                        habit.id
                      )}
                      onCheckedChange={(value) =>
                        toggleHabit(habit.id, value === true)
                      }
                      trackDays={recoveryDays}
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
                Rhythm-aware scoring
              </span>
              <input
                type="checkbox"
                checked={streakEnabled}
                onChange={(e) => setStreakEnabled(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300"
              />
            </label>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">
              When on, points gently reflect recent continuity (capped at 3 days)
              so direction matters more than perfection. For slips you&apos;re
              tracking as negatives, repeated marks close together can deepen
              impact — still softly capped. When off, each day stays a simple +1
              or −1.
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
              <span className="font-medium text-amber-900/90">Negative</span>{" "}
              notes slips without shame. Tap{" "}
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
                            ? "Momentum can deepen score (up to 3)"
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

            <section className="overflow-hidden rounded-2xl border border-amber-200/90 bg-amber-50/35">
              <div className="border-b border-amber-100 bg-amber-100/60 px-3 py-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-950/90">
                  Negative — slips & recovery
                </p>
              </div>
              <div className="divide-y divide-amber-100/90">
                {negativeList.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-amber-950/75">
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
                        className="mt-0.5 inline-flex shrink-0 rounded-full bg-orange-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
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
                            ? `If slips cluster, impact deepens gently (×${h.penaltyMultiplier ?? 1}, capped at 3)`
                            : "Flat −1 when marked"}
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
  /** Days for semantic label: momentum (positive) or recovery (negative); null hides */
  trackDays: number | null;
  score: number;
  variant?: "positive" | "negative";
};

function HabitRow({
  name,
  checked,
  onCheckedChange,
  trackDays,
  score,
  variant,
}: HabitRowProps) {
  const headline =
    trackDays === null
      ? null
      : variant === "positive"
        ? positiveMomentumHeadline(trackDays)
        : negativeRecoveryHeadline(trackDays);

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Checkbox
            checked={checked}
            onCheckedChange={onCheckedChange}
            className={`h-5 w-5 rounded-full border-zinc-300 ${
              variant === "positive"
                ? "data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                : "data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
            }`}
          />

          <p className="font-semibold text-base truncate text-zinc-900">
            {name}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {headline !== null ? (
            <div className="text-right min-w-[7.5rem]">
              <p
                className={`text-[11px] font-medium leading-snug ${
                  variant === "positive"
                    ? "text-emerald-800/90"
                    : "text-amber-900/85"
                }`}
              >
                {headline}
              </p>
              <p className="text-[11px] text-zinc-400 tabular-nums mt-0.5">
                {trackDays} {trackDays === 1 ? "day" : "days"}
              </p>
            </div>
          ) : null}

          <span
            className={`text-sm font-semibold tabular-nums min-w-[2ch] text-right ${
              score > 0
                ? "text-emerald-600"
                : score < 0
                  ? variant === "negative"
                    ? "text-amber-800/95"
                    : "text-rose-600/90"
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
