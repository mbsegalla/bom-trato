import type { ScheduleCalendarDay, ScheduleItem, ScheduleRange } from '../types/schedule.types';

export function createMonthDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function changeMonth(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function getMonthRange(month: Date): ScheduleRange {
  return {
    from: new Date(month.getFullYear(), month.getMonth(), 1),
    to: new Date(month.getFullYear(), month.getMonth() + 1, 1),
  };
}

export function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function isSameMonth(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
}

export function dateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

export function getCalendarDays(month: Date): ScheduleCalendarDay[] {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);

  const mondayOffset = (firstDay.getDay() + 6) % 7;

  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

  const cellCount = Math.ceil((mondayOffset + daysInMonth) / 7) * 7;

  const today = new Date();

  return Array.from({ length: cellCount }, (_, index) => {
    const date = new Date(month.getFullYear(), month.getMonth(), 1 - mondayOffset + index);

    return {
      date,
      currentMonth: isSameMonth(date, month),
      today: isSameDay(date, today),
    };
  });
}

export function getScheduleItemsForDay(items: ScheduleItem[], day: Date): ScheduleItem[] {
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const end = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);

  return items
    .filter((item) => item.scheduledStartAt < end && item.scheduledEndAt > start)
    .sort((left, right) => left.scheduledStartAt.getTime() - right.scheduledStartAt.getTime());
}
