import type { AppStorage, DayData, Habit } from "@/lib/life-tracker";
import { addDaysUtc } from "@/lib/life-tracker";

export function getHabitChecked(
  entries: AppStorage["entries"],
  dateKey: string,
  habitId: string
) {
  return !!entries[dateKey]?.checked?.[habitId];
}

export function getHabitStreak(
  entries: AppStorage["entries"],
  habitId: string,
  dateKey: string
) {
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const key = addDaysUtc(dateKey, -i);
    if (getHabitChecked(entries, key, habitId)) streak++;
    else break;
  }
  return streak;
}

/** Consecutive days without a check — used for negative-habit “recovery” display (not scoring). */
export function getRecoveryStreak(
  entries: AppStorage["entries"],
  habitId: string,
  dateKey: string
) {
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const key = addDaysUtc(dateKey, -i);
    if (!getHabitChecked(entries, key, habitId)) streak++;
    else break;
  }
  return streak;
}

export function getHabitScore(
  entries: AppStorage["entries"],
  habit: Habit,
  dateKey: string,
  streak: number
) {
  const isChecked = getHabitChecked(entries, dateKey, habit.id);
  if (!isChecked) return 0;

  if (habit.type === "positive") {
    if (!habit.streakEnabled) return 1;
    return Math.min(streak, 3);
  }

  if (!habit.streakEnabled) return -1;
  return -(Math.min(streak, 3) * (habit.penaltyMultiplier || 1));
}

export function getScoreForDate(store: AppStorage, dateKey: string) {
  const raw = store.habits.reduce((sum, habit) => {
    const streak = habit.streakEnabled
      ? getHabitStreak(store.entries, habit.id, dateKey)
      : 0;
    return sum + getHabitScore(store.entries, habit, dateKey, streak);
  }, 0);

  return Math.max(raw, -7);
}

export function removeHabitFromEntries(
  prevEntries: Record<string, DayData>,
  habitId: string
) {
  const next: Record<string, DayData> = {};
  for (const [dateKey, day] of Object.entries(prevEntries)) {
    const checked = { ...day.checked };
    delete checked[habitId];
    if (Object.keys(checked).length > 0) next[dateKey] = { checked };
  }
  return next;
}

