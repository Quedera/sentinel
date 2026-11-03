import type { AvailabilityMap } from "@/lib/types";

interface AvailabilityCalendarProps {
  availability: AvailabilityMap;
  month?: string; // YYYY-MM
}

export function AvailabilityCalendar({
  availability,
  month = "2026-09",
}: AvailabilityCalendarProps) {
  const [year, monthNum] = month.split("-").map(Number);
  const firstDay = new Date(year, monthNum - 1, 1);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  // Monday-first grid: 0 = Mon, 6 = Sun
  const startDayOfWeek = (firstDay.getDay() + 6) % 7;

  const days: (number | null)[] = [];
  for (let i = 0; i < startDayOfWeek; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const monthName = new Date(year, monthNum - 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const cell = (day: number) => {
    const dateKey = `${year}-${String(monthNum).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const status = availability[dateKey];
    const className =
      status === "available"
        ? "bg-quedera-emerald/10 text-quedera-emerald font-semibold"
        : status === "unavailable"
        ? "bg-quedera-surface text-quedera-navy/40"
        : status === "booked"
        ? "bg-quedera-surface text-quedera-amber"
        : "bg-quedera-surface text-quedera-navy/80 border border-quedera-surface";
    return (
      <div
        key={day}
        className={`aspect-square flex items-center justify-center rounded text-sm ${className}`}
        title={status || "not set"}
      >
        {day}
      </div>
    );
  };

  return (
    <div>
      <h4 className="font-semibold text-quedera-navy mb-3 text-sm tracking-wider">
        {monthName.toUpperCase()}
      </h4>
      <div className="grid grid-cols-7 gap-1 text-xs text-center text-quedera-navy/50 mb-1">
        {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d) => (
          <div key={d} className="font-semibold">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => (day === null ? <div key={`e-${idx}`} /> : cell(day)))}
      </div>
      <div className="flex flex-wrap gap-4 mt-4 text-xs text-quedera-navy/70">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-quedera-emerald/10" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-quedera-surface" /> Unavailable
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-quedera-surface" /> Booked
        </span>
      </div>
    </div>
  );
}
