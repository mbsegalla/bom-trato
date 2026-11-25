interface WorkOrderChecklistProgressProps {
  total: number;
  completed: number;
  label: string;
}

export function WorkOrderChecklistProgress({ total, completed, label }: WorkOrderChecklistProgressProps) {
  if (total === 0) {
    return null;
  }

  const percentage = Math.round((completed / total) * 100);

  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <p role="status" className="font-medium">
          {completed} de {total} {total === 1 ? 'item concluído' : 'itens concluídos'}
        </p>

        <span aria-hidden="true" className="text-muted-foreground">
          {percentage}%
        </span>
      </div>

      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={completed}
        aria-valuetext={`${completed} de ${total} itens concluídos`}
        className="h-2 overflow-hidden rounded-full bg-muted"
      >
        <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
