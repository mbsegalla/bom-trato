import { Clock3 } from 'lucide-react';

interface TimePickerProps {
  value: Date;
  minuteStep: number;
  disabled?: boolean;
  onChange(value: Date): void;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function TimePicker({ value, minuteStep, disabled, onChange }: TimePickerProps) {
  const hours = Array.from({ length: 24 }, (_, index) => index);

  const configuredMinutes = Array.from(
    {
      length: Math.ceil(60 / minuteStep),
    },
    (_, index) => index * minuteStep,
  ).filter((minute) => minute < 60);

  const minutes = configuredMinutes.includes(value.getMinutes())
    ? configuredMinutes
    : [...configuredMinutes, value.getMinutes()].sort((left, right) => left - right);

  function changeHour(hour: number): void {
    const next = new Date(value);

    next.setHours(hour);

    onChange(next);
  }

  function changeMinute(minute: number): void {
    const next = new Date(value);

    next.setMinutes(minute);
    next.setSeconds(0, 0);

    onChange(next);
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <Clock3 aria-hidden="true" className="size-4 text-muted-foreground" />

        <p className="text-sm font-medium">Horário</p>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <select
          aria-label="Hora"
          value={value.getHours()}
          disabled={disabled}
          onChange={(event) => changeHour(Number(event.currentTarget.value))}
          className="h-10 flex-1 cursor-pointer rounded-xl border border-input bg-background px-3 text-center text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
        >
          {hours.map((hour) => (
            <option key={hour} value={hour}>
              {pad(hour)}
            </option>
          ))}
        </select>

        <span className="font-semibold text-muted-foreground">:</span>

        <select
          aria-label="Minuto"
          value={value.getMinutes()}
          disabled={disabled}
          onChange={(event) => changeMinute(Number(event.currentTarget.value))}
          className="h-10 flex-1 cursor-pointer rounded-xl border border-input bg-background px-3 text-center text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
        >
          {minutes.map((minute) => (
            <option key={minute} value={minute}>
              {pad(minute)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
