"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import {
  addDaysUtc,
  getTodayKey,
  isValidDateKey,
  loadInitialStorage,
} from "@/lib/life-tracker";
import { trackEvent } from "@/lib/analytics";
import { getScoreForDate } from "@/lib/scoring";

function monthKeyFromDateKey(dateKey: string) {
  return dateKey.slice(0, 7); // YYYY-MM
}

function monthTitle(monthKey: string) {
  const [y, m] = monthKey.split("-").map((n) => Number(n));
  const d = new Date(Date.UTC(y, m - 1, 1));
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function startOfMonthKey(monthKey: string) {
  return `${monthKey}-01`;
}

function daysInMonth(monthKey: string) {
  const [y, m] = monthKey.split("-").map((n) => Number(n));
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

function weekdayIndexSun0(dateKey: string) {
  const d = new Date(`${dateKey}T00:00:00.000Z`);
  return d.getUTCDay(); // 0=Sun
}

export default function CalendarClient({
  initialDateKey,
}: {
  initialDateKey?: string;
}) {
  const router = useRouter();

  const todayKey = getTodayKey();
  const selectedDate = isValidDateKey(initialDateKey) ? initialDateKey : todayKey;

  const [month, setMonth] = useState(() => monthKeyFromDateKey(selectedDate));
  const store = useMemo(() => loadInitialStorage(), []);

  useEffect(() => {
    trackEvent("calendar_opened", {
      selected_date: selectedDate,
      month_key: monthKeyFromDateKey(selectedDate),
    });
    // One event per calendar route visit (anchor is whatever the URL was at mount).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grid = useMemo(() => {
    const firstKey = startOfMonthKey(month);
    const pad = weekdayIndexSun0(firstKey);
    const dim = daysInMonth(month);

    const cells: Array<
      | { kind: "empty"; key: string }
      | { kind: "day"; dateKey: string; day: number }
    > = [];

    for (let i = 0; i < pad; i++) cells.push({ kind: "empty", key: `e-${i}` });
    for (let day = 1; day <= dim; day++) {
      const dateKey = `${month}-${String(day).padStart(2, "0")}`;
      cells.push({ kind: "day", dateKey, day });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ kind: "empty", key: `e-tail-${cells.length}` });
    }

    return cells;
  }, [month]);

  function scoreColor(score: number) {
    if (score > 0) return "text-green-600";
    if (score < 0) return "text-red-600";
    return "text-zinc-400";
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 px-4 py-5">
      <div className="max-w-sm mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push(`/?d=${selectedDate}`)}
            className="text-sm text-zinc-600"
          >
            Back
          </button>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                const first = startOfMonthKey(month);
                setMonth(addDaysUtc(first, -1).slice(0, 7));
              }}
              className="h-9 w-9 flex items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 active:bg-zinc-50"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => {
                const first = startOfMonthKey(month);
                setMonth(addDaysUtc(first, 32).slice(0, 7));
              }}
              className="h-9 w-9 flex items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-700 active:bg-zinc-50"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
          <p className="text-sm text-zinc-500">{monthTitle(month)}</p>
        </div>

        <Card className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-zinc-100 bg-zinc-50">
            {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
              <div
                key={d}
                className="py-2 text-center text-[11px] font-semibold text-zinc-500"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-px bg-zinc-100">
            {grid.map((cell) => {
              if (cell.kind === "empty") {
                return <div key={cell.key} className="bg-white h-16" />;
              }

              const score = getScoreForDate(store, cell.dateKey);
              const isSelected = cell.dateKey === selectedDate;
              const isToday = cell.dateKey === todayKey;

              return (
                <button
                  key={cell.dateKey}
                  type="button"
                  onClick={() => router.push(`/?d=${cell.dateKey}`)}
                  className={[
                    "bg-white h-16 px-2 py-2 text-left",
                    "active:bg-zinc-50",
                    isSelected ? "ring-2 ring-zinc-900/10" : "",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={[
                        "text-sm font-semibold",
                        isToday ? "text-zinc-900" : "text-zinc-700",
                      ].join(" ")}
                    >
                      {cell.day}
                    </span>
                    {isToday ? (
                      <span className="text-[10px] font-semibold text-zinc-400">
                        today
                      </span>
                    ) : null}
                  </div>
                  <div
                    className={[
                      "mt-1 text-xs font-semibold tabular-nums",
                      scoreColor(score),
                    ].join(" ")}
                  >
                    {score > 0 ? `+${score}` : `${score}`}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <p className="text-xs text-zinc-500 text-center">
          Tap a day to reflect and edit.
        </p>
      </div>
    </main>
  );
}

