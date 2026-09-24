import type { z } from 'zod';

import type { scheduleItemSchema, scheduleResponseSchema } from '../schemas/schedule.schema';

export type ScheduleItem = z.infer<typeof scheduleItemSchema>;

export type SchedulePage = z.infer<typeof scheduleResponseSchema>;

export type ScheduleStatusFilter = 'ALL' | 'SCHEDULED' | 'IN_PROGRESS';

export type ScheduleLateFilter = 'ALL' | 'LATE' | 'ON_TIME';

export interface ScheduleFilters {
  assignedToId: string | null;
  status: ScheduleStatusFilter;
  late: ScheduleLateFilter;
}

export interface ScheduleData {
  items: ScheduleItem[];
  generatedAt: Date;
  from: Date;
  to: Date;
}

export interface ScheduleRange {
  from: Date;
  to: Date;
}

export interface ScheduleCalendarDay {
  date: Date;
  currentMonth: boolean;
  today: boolean;
}
