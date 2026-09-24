import type { ServiceUnit } from '../types/catalogService.types';

export const serviceUnitOptions: {
  value: ServiceUnit;
  label: string;
}[] = [
  {
    value: 'SERVICE',
    label: 'Serviço',
  },
  {
    value: 'HOUR',
    label: 'Hora',
  },
  {
    value: 'DAY',
    label: 'Dia',
  },
  {
    value: 'UNIT',
    label: 'Unidade',
  },
  {
    value: 'SQUARE_METER',
    label: 'Metro quadrado',
  },
];

export function getServiceUnitLabel(unit: ServiceUnit): string {
  return serviceUnitOptions.find((option) => option.value === unit)?.label ?? unit;
}
