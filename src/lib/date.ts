const SEOUL = "Asia/Seoul";
export function validDateTime(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+09:00$/.test(value))
    return false;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return false;
  // Date가 2월 30일 등을 다음 달로 보정한 경우도 거부합니다.
  return (
    new Date(date.getTime() + 9 * 3600000).toISOString().slice(0, 19) ===
    value.slice(0, 19)
  );
}
export function seoulParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SEOUL,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}
export function formatWedding(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: SEOUL,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(value));
}
export function calendarFor(value: string) {
  const { year, month, day } = seoulParts(new Date(value));
  const offset = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const count = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: count }, (_, index) => index + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  return { year, month, day, cells };
}
export function daysUntil(value: string, now = new Date()) {
  const target = seoulParts(new Date(value));
  const today = seoulParts(now);
  return Math.round(
    (Date.UTC(target.year, target.month - 1, target.day) -
      Date.UTC(today.year, today.month - 1, today.day)) /
      86400000,
  );
}
export function dDayLabel(days: number) {
  return days === 0 ? "D-day" : days > 0 ? `D-${days}` : `D+${Math.abs(days)}`;
}
const escapeIcs = (value: string) =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
function foldLine(value: string) {
  const encoder = new TextEncoder();
  let result = "",
    bytes = 0;
  for (const char of value) {
    const size = encoder.encode(char).length;
    if (bytes + size > 75) {
      result += "\r\n ";
      bytes = 1;
    }
    result += char;
    bytes += size;
  }
  return result;
}
export function createCalendarEvent(
  options: {
    dateTime: string | null;
    confirmed: boolean;
    title: string;
    location: string;
    durationMinutes: number;
  },
  now = new Date(),
) {
  if (!options.confirmed || !validDateTime(options.dateTime))
    throw new Error("확정된 예식 일시만 저장할 수 있습니다.");
  const stamp = (date: Date) =>
    date
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
  const start = new Date(options.dateTime);
  const end = new Date(
    start.getTime() + Math.max(1, options.durationMinutes) * 60000,
  );
  return (
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Our Wedding//KO",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:${stamp(start)}-wedding@our-invitation`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      `SUMMARY:${escapeIcs(options.title)}`,
      `LOCATION:${escapeIcs(options.location)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .map(foldLine)
      .join("\r\n") + "\r\n"
  );
}
