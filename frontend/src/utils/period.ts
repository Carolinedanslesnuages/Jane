/** AAAA-MM-JJ of a date in local time (what a date input uses). */
export function toInputDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** The first instant of a local day, as an ISO string. */
export function startOfLocalDay(inputDate: string): string {
  const [year, month, day] = inputDate.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0).toISOString();
}

/** The last instant of a local day, as an ISO string. */
export function endOfLocalDay(inputDate: string): string {
  const [year, month, day] = inputDate.split('-').map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();
}

export function daysAgo(count: number, from: Date = new Date()): Date {
  const date = new Date(from);
  date.setDate(date.getDate() - count);
  return date;
}
