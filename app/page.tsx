// "use client";

// import { useEffect, useMemo, useState } from "react";
// import { Checkbox } from "@/components/ui/checkbox";
// import { Card } from "@/components/ui/card";
// import { Separator } from "@/components/ui/separator";

// type HabitType = "positive" | "negative";

// type Habit = {
//   id: string;
//   name: string;
//   type: HabitType;
//   streakEnabled: boolean;
//   penaltyMultiplier?: number;
// };

// const HABITS: Habit[] = [
//   {
//     id: "wake-early",
//     name: "Wake Early",
//     type: "positive",
//     streakEnabled: true,
//   },
//   {
//     id: "workout",
//     name: "Workout",
//     type: "positive",
//     streakEnabled: true,
//   },
//   {
//     id: "deep-work",
//     name: "Deep Work",
//     type: "positive",
//     streakEnabled: true,
//   },
//   {
//     id: "urges-resisted",
//     name: "Urges Resisted",
//     type: "positive",
//     streakEnabled: true,
//   },
//   {
//     id: "learning",
//     name: "Learning",
//     type: "positive",
//     streakEnabled: false,
//   },
//   {
//     id: "phone-less-1h",
//     name: "Phone < 1h",
//     type: "positive",
//     streakEnabled: false,
//   },
//   {
//     id: "early-watching",
//     name: "Early Watching",
//     type: "negative",
//     streakEnabled: true,
//     penaltyMultiplier: 1,
//   },
//   {
//     id: "full-relapse",
//     name: "Full Relapse",
//     type: "negative",
//     streakEnabled: true,
//     penaltyMultiplier: 2,
//   },
//   {
//     id: "netflix",
//     name: "Netflix",
//     type: "negative",
//     streakEnabled: false,
//   },
//   {
//     id: "social-media",
//     name: "Social Media",
//     type: "negative",
//     streakEnabled: false,
//   },
//   {
//     id: "sugar",
//     name: "Sugar",
//     type: "negative",
//     streakEnabled: false,
//   },
// ];

// type DayData = {
//   checked: Record<string, boolean>;
// };

// type StorageData = {
//   [date: string]: DayData;
// };

// const STORAGE_KEY = "life-tracker-v1";

// function getTodayKey() {
//   return new Date().toISOString().split("T")[0];
// }

// function getYesterdayKey() {
//   const date = new Date();
//   date.setDate(date.getDate() - 1);
//   return date.toISOString().split("T")[0];
// }

// export default function Page() {
//   const [data, setData] = useState<StorageData>(() => {
//     if (typeof window === "undefined") return {};
//     const saved = window.localStorage.getItem(STORAGE_KEY);
//     if (!saved) return {};
//     try {
//       return JSON.parse(saved) as StorageData;
//     } catch {
//       return {};
//     }
//     });

//   const todayKey = getTodayKey();
//   const yesterdayKey = getYesterdayKey();

//   useEffect(() => {
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
//   }, [data]);

//   const today = data[todayKey]?.checked || {};
//   const yesterday = data[yesterdayKey]?.checked || {};

//   function toggleHabit(habitId: string, checked: boolean) {
//     setData((prev) => ({
//       ...prev,
//       [todayKey]: {
//         checked: {
//           ...(prev[todayKey]?.checked || {}),
//           [habitId]: checked,
//         },
//       },
//     }));
//   }

//   function calculateStreak(habitId: string) {
//     let streak = 0;

//     for (let i = 0; i < 365; i++) {
//       const date = new Date();
//       date.setDate(date.getDate() - i);

//       const key = date.toISOString().split("T")[0];

//       if (data[key]?.checked?.[habitId]) {
//         streak++;
//       } else {
//         break;
//       }
//     }

//     return streak;
//   }

//   function calculateHabitScore(habit: Habit) {
//     const isChecked = today[habit.id];

//     if (!isChecked) return 0;

//     if (habit.type === "positive") {
//       if (!habit.streakEnabled) return 1;

//       return Math.min(calculateStreak(habit.id), 3);
//     }

//     if (!habit.streakEnabled) return -1;

//     const penalty = Math.min(calculateStreak(habit.id), 3);

//     return -(penalty * (habit.penaltyMultiplier || 1));
//   }

//   const totalScore = useMemo(() => {
//     const total = HABITS.reduce((sum, habit) => {
//       return sum + calculateHabitScore(habit);
//     }, 0);

//     return Math.max(total, -7);
//   }, [today, data]);

//   const positives = HABITS.filter((h) => h.type === "positive");
//   const negatives = HABITS.filter((h) => h.type === "negative");

//   return (
//     <main className="min-h-screen bg-zinc-50 text-zinc-900 px-4 py-6">
//       <div className="max-w-md mx-auto space-y-5">
//         <div className="space-y-2">
//           <div className="flex items-center justify-between text-zinc-500 text-sm">
//             <span>{new Date(todayKey).toLocaleDateString(undefined, {
//               month: "long",
//               day: "numeric",
//               year: "numeric",
//             })}</span>
//             <span>{new Date(todayKey).toLocaleDateString(undefined, {
//               weekday: "long",
//             })}</span>
//           </div>

//           <h1 className="text-4xl font-bold tracking-tight">Today</h1>
//         </div>

//         <div className="grid grid-cols-2 gap-3">
//           <Card className="bg-white border border-zinc-200 rounded-3xl px-5 py-4 shadow-sm">
//             <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
//               Today&apos;s Score
//             </p>

//             <h2
//               className={`text-4xl font-bold mt-2 ${
//                 totalScore >= 0 ? "text-green-500" : "text-red-500"
//               }`}
//             >
//               {totalScore > 0 ? "+" : ""}
//               {totalScore}
//             </h2>
//           </Card>

//           <Card className="bg-white border border-zinc-200 rounded-3xl px-5 py-4 shadow-sm">
//             <p className="text-xs font-semibold tracking-wide text-zinc-500 uppercase">
//               Total Score
//             </p>

//             <h2 className="text-4xl font-bold mt-2 text-zinc-900">247</h2>

//             <p className="text-sm text-zinc-500 mt-0.5">All time</p>
//           </Card>
//         </div>

//         <section className="space-y-3">
//           <div>
//             <h3 className="text-xl font-bold tracking-wide text-green-500 uppercase">Positive Habits</h3>
            
//           </div>

//           <div className="space-y-2">
//             {positives.map((habit) => {
//               const streak = calculateStreak(habit.id);
//               const score = calculateHabitScore(habit);

//               return (
//                 <HabitRow
//                   key={habit.id}
//                   name={habit.name}
//                   checked={!!today[habit.id]}
//                   onCheckedChange={(value) =>
//                     toggleHabit(habit.id, value === true)
//                   }
//                   streak={habit.streakEnabled ? streak : null}
//                   score={score}
//                 />
//               );
//             })}
//           </div>
//         </section>

//         <Separator className="bg-zinc-200" />

//         <section className="space-y-3">
//           <div>
//             <h3 className="text-xl font-bold tracking-wide text-red-500 uppercase">Negative Habits</h3>
            
//           </div>

//           <div className="space-y-2">
//             {negatives.map((habit) => {
//               const streak = calculateStreak(habit.id);
//               const score = calculateHabitScore(habit);

//               return (
//                 <HabitRow
//                   key={habit.id}
//                   name={habit.name}
//                   checked={!!today[habit.id]}
//                   onCheckedChange={(value) =>
//                     toggleHabit(habit.id, value === true)
//                   }
//                   streak={habit.streakEnabled ? streak : null}
//                   score={score}
//                 />
//               );
//             })}
//           </div>
//         </section>
//       </div>
//     </main>
//   );
// }

// type HabitRowProps = {
//   name: string;
//   checked: boolean;
//   onCheckedChange: (checked: boolean) => void;
//   streak: number | null;
//   score: number;
// };

// function HabitRow({
//   name,
//   checked,
//   onCheckedChange,
//   streak,
//   score,
// }: HabitRowProps) {
//   return (
//     <Card className="bg-white border border-zinc-200 rounded-2xl px-5 py-5 shadow-sm">
//       <div className="flex items-center justify-between gap-4">
//         <div className="flex items-center gap-4 min-w-0 flex-1">
//           <Checkbox
//             checked={checked}
//             onCheckedChange={onCheckedChange}
//             className="h-6 w-6 rounded-full border-zinc-300"
//           />

//           <p className="font-semibold text-xl truncate text-zinc-900">
//             {name}
//           </p>
//         </div>

//         <div className="flex items-center gap-2 shrink-0">
//           {streak !== null && (
//             <span className="text-lg text-zinc-500 font-medium">
//               {score >= 0 ? "🔥" : "✖"} {Math.min(streak, 3)}
//             </span>
//           )}

//           {score !== 0 && (
//             <span
//               className={`text-2xl font-semibold ${
//                 score >= 0 ? "text-green-500" : "text-red-500"
//               }`}
//             >
//               {score > 0 ? "+" : ""}
//               {score}
//             </span>
//           )}

//           {score === 0 && (
//             <span className="text-2xl text-zinc-400 font-medium">0</span>
//           )}
//         </div>
//       </div>
//     </Card>
//   );
// }
"use client";

import { useEffect, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type HabitType = "positive" | "negative";

type Habit = {
  id: string;
  name: string;
  type: HabitType;
  streakEnabled: boolean;
  penaltyMultiplier?: number;
};

const HABITS: Habit[] = [
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

type DayData = {
  checked: Record<string, boolean>;
};

type StorageData = {
  [date: string]: DayData;
};

const STORAGE_KEY = "life-tracker-v1";

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function addDaysUtc(dateKey: string, deltaDays: number) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + deltaDays);
  return date.toISOString().split("T")[0];
}

export default function Page() {
  const [data, setData] = useState<StorageData>(() => {
    if (typeof window === "undefined") return {};
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return {};
    try {
      return JSON.parse(saved) as StorageData;
    } catch {
      return {};
    }
  });

  const todayKey = getTodayKey();
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);
  const isAtToday = selectedDate === todayKey;

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  function getHabitChecked(dateKey: string, habitId: string) {
    return !!data[dateKey]?.checked?.[habitId];
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

  function getDayScore(dateKey: string) {
    const raw = HABITS.reduce((sum, habit) => {
      const streak = habit.streakEnabled ? getHabitStreak(habit.id, dateKey) : 0;
      return sum + getHabitScore(habit, dateKey, streak);
    }, 0);

    return Math.max(raw, -7);
  }

  function toggleHabit(habitId: string, checked: boolean) {
    setData((prev) => ({
      ...prev,
      [selectedDate]: {
        checked: {
          ...(prev[selectedDate]?.checked || {}),
          [habitId]: checked,
        },
      },
    }));
  }

  const dayScore = getDayScore(selectedDate);
  const totalScoreAllTime = Object.keys(data).reduce((sum, dateKey) => {
    return sum + getDayScore(dateKey);
  }, 0);

  const positives = HABITS.filter((h) => h.type === "positive");
  const negatives = HABITS.filter((h) => h.type === "negative");

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 px-4 py-5">
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
          </Card>
        </section>

        <Separator className="bg-zinc-200" />

        <section className="space-y-2">
          <h3 className="text-sm font-extrabold tracking-widest text-red-500 uppercase">
            Negative Habits
          </h3>

          <Card className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
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
          </Card>
        </section>
      </div>
    </main>
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
                : ""
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
