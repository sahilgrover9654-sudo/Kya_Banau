/**
 * Date formatting helpers for Kya Banau meal planning
 * Output format requirement: "Monday, 3rd Jul"
 */

export function getOrdinalSuffix(dayNum: number): string {
  const j = dayNum % 10;
  const k = dayNum % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
}

export function formatDayWithDate(date: Date): string {
  const dayName = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);
  const dayNum = date.getDate();
  const month3 = new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
  const suffix = getOrdinalSuffix(dayNum);
  return `${dayName}, ${dayNum}${suffix} ${month3}`;
}

export function computePlanDates<T extends { day: string; dateStr?: string; isToday?: boolean }>(
  days: T[],
  startDate: Date = new Date()
): (T & { dateStr: string; isToday: boolean })[] {
  return days.map((dayItem, index) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + index);

    const formatted = formatDayWithDate(d);
    const dayName = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(d);

    return {
      ...dayItem,
      day: dayName,
      dateStr: dayItem.dateStr || formatted,
      isToday: index === 0,
    };
  });
}
