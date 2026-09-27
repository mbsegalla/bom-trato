'use client';

import { DatePickerField, type DatePickerFieldProps } from './datePickerField';

type SharedProps = Omit<DatePickerFieldProps, 'mode'>;

export function DatePicker(props: SharedProps) {
  return <DatePickerField {...props} mode="date" />;
}

export function DateTimePicker(props: SharedProps) {
  return <DatePickerField {...props} mode="datetime" />;
}
