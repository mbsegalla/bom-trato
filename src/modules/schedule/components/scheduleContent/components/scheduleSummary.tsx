import type { ScheduleData } from '../../../types/schedule.types';

export function ScheduleSummary({ data }: { data: ScheduleData }) {
  const scheduledCount = data.items.filter((item) => item.status === 'SCHEDULED').length;
  const inProgressCount = data.items.filter((item) => item.status === 'IN_PROGRESS').length;
  const lateCount = data.items.filter((item) => item.late).length;

  return (
    <section className="grid border-y border-border sm:grid-cols-2 xl:grid-cols-4">
      <div className="py-5 sm:pr-5">
        <p className="text-sm text-muted-foreground">No período</p>
        <p className="mt-1 text-2xl font-semibold">{data.items.length}</p>
      </div>

      <div className="border-t border-border py-5 sm:border-t-0 sm:border-l sm:pl-5 xl:px-5">
        <p className="text-sm text-muted-foreground">Agendados</p>
        <p className="mt-1 text-2xl font-semibold text-primary">{scheduledCount}</p>
      </div>

      <div className="border-t border-border py-5 xl:border-t-0 xl:border-l xl:px-5">
        <p className="text-sm text-muted-foreground">Em andamento</p>
        <p className="mt-1 text-2xl font-semibold text-success">{inProgressCount}</p>
      </div>

      <div className="border-t border-border py-5 xl:border-t-0 xl:border-l xl:pl-5">
        <p className="text-sm text-muted-foreground">Atrasados</p>
        <p className="mt-1 text-2xl font-semibold text-warning">{lateCount}</p>
      </div>
    </section>
  );
}
