import CalendarClient from "@/app/calendar/calendar-client";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams?: Promise<{ d?: string }>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  return <CalendarClient initialDateKey={sp?.d} />;
}

